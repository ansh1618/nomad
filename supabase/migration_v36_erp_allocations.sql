-- ============================================================
-- Migration v36: Destination-coded Booking IDs & Atomic PL/pgSQL Transaction
-- ============================================================

-- 1. Destination-coded Booking ID Generator
-- Examples: NMK-MAN-260701 (Manali), NMK-UDP-260801 (Udaipur), NMK-CHP-260501 (Chopta)
CREATE SEQUENCE IF NOT EXISTS public.booking_dest_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_destination_booking_id(p_code text DEFAULT 'NOM')
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_prefix text;
  v_seq bigint;
  v_id text;
BEGIN
  v_prefix := UPPER(COALESCE(NULLIF(TRIM(p_code), ''), 'NOM'));
  IF LENGTH(v_prefix) > 3 THEN
    v_prefix := SUBSTRING(v_prefix FROM 1 FOR 3);
  END IF;
  v_seq := nextval('public.booking_dest_seq');
  v_id := 'NMK-' || v_prefix || '-' || to_char(now(), 'YYMM') || lpad((v_seq % 1000)::text, 2, '0');
  RETURN v_id;
END;
$$;

-- 2. Driver & Staff Assignment Columns for ERP
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS assigned_driver_id uuid;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS passenger_manifest_generated boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS hotel_manifest_generated boolean DEFAULT false;

-- 3. Atomic Transaction Function for Complete Booking Creation
CREATE OR REPLACE FUNCTION public.create_complete_booking_tx(
  p_user_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_departure_id uuid,
  p_journey_id uuid,
  p_destination_code text,
  p_travellers jsonb,
  p_addons jsonb,
  p_coupon_id uuid,
  p_base_amount numeric,
  p_addon_amount numeric,
  p_discount_amount numeric,
  p_gst_amount numeric,
  p_total_amount numeric,
  p_room_sharing text,
  p_pickup_point text,
  p_special_requests text
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_customer_id uuid;
  v_booking_db_id uuid;
  v_display_ref text;
  v_traveller jsonb;
  v_addon jsonb;
BEGIN
  -- 1. Create or Find Customer
  IF p_customer_phone IS NOT NULL AND p_customer_phone <> '' THEN
    SELECT id INTO v_customer_id FROM public.customers WHERE phone = p_customer_phone LIMIT 1;
  END IF;

  IF v_customer_id IS NULL AND p_customer_email IS NOT NULL AND p_customer_email <> '' THEN
    SELECT id INTO v_customer_id FROM public.customers WHERE email = p_customer_email LIMIT 1;
  END IF;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (name, phone, email, whatsapp)
    VALUES (COALESCE(p_customer_name, 'Explorer'), p_customer_phone, p_customer_email, p_customer_phone)
    RETURNING id INTO v_customer_id;
  END IF;

  -- Generate Reference ID
  v_display_ref := public.generate_destination_booking_id(p_destination_code);

  -- 2. Create Booking
  INSERT INTO public.bookings (
    booking_id, user_id, customer_id, departure_id, journey_id, coupon_id,
    status, booking_status, payment_status, traveller_count,
    base_amount, addon_amount, discount_amount, gst_amount, total_amount, amount_paid, balance_due,
    room_sharing, pickup_point, special_requests, booking_source
  ) VALUES (
    v_display_ref, p_user_id, v_customer_id, p_departure_id, p_journey_id, p_coupon_id,
    'PAYMENT_PENDING', 'Pending', 'Pending', jsonb_array_length(COALESCE(p_travellers, '[]'::jsonb)),
    p_base_amount, p_addon_amount, p_discount_amount, p_gst_amount, p_total_amount, 0, p_total_amount,
    p_room_sharing, p_pickup_point, p_special_requests, 'Website'
  ) RETURNING id INTO v_booking_db_id;

  -- 3. Insert Travellers
  IF p_travellers IS NOT NULL AND jsonb_array_length(p_travellers) > 0 THEN
    FOR v_traveller IN SELECT * FROM jsonb_array_elements(p_travellers)
    LOOP
      INSERT INTO public.booking_travellers (
        booking_id, is_primary, full_name, phone, email, gender, age, room_sharing, pickup_point
      ) VALUES (
        v_booking_db_id,
        COALESCE((v_traveller->>'isPrimary')::boolean, false),
        COALESCE(v_traveller->>'fullName', 'Explorer'),
        v_traveller->>'phone',
        v_traveller->>'email',
        v_traveller->>'gender',
        (v_traveller->>'age')::integer,
        p_room_sharing,
        p_pickup_point
      );
    END LOOP;
  END IF;

  -- 4. Insert Addons
  IF p_addons IS NOT NULL AND jsonb_array_length(p_addons) > 0 THEN
    FOR v_addon IN SELECT * FROM jsonb_array_elements(p_addons)
    LOOP
      INSERT INTO public.booking_addons (booking_id, addon_id, name, price)
      VALUES (
        v_booking_db_id,
        (v_addon->>'id')::uuid,
        COALESCE(v_addon->>'name', v_addon->>'title', 'Addon Experience'),
        COALESCE((v_addon->>'price')::numeric, 0)
      );
    END LOOP;
  END IF;

  -- 5. Insert Payment Record
  INSERT INTO public.payments (booking_id, amount, currency, status, payment_type, payment_gateway, gateway)
  VALUES (v_booking_db_id, p_total_amount, 'INR', 'Pending', 'FULL', 'RAZORPAY', 'razorpay');

  -- 6. Insert Timeline Entry
  INSERT INTO public.booking_timeline (booking_id, event, description, actor)
  VALUES (v_booking_db_id, 'Booking Created', 'Booking initialized securely via atomic transaction', 'USER');

  -- 7. Insert Audit Log
  INSERT INTO public.booking_logs (booking_id, action, payload, response)
  VALUES (
    v_booking_db_id, 'CREATE_BOOKING_TRANSACTION',
    jsonb_build_object('user_id', p_user_id, 'departure_id', p_departure_id, 'total_amount', p_total_amount),
    jsonb_build_object('booking_id', v_booking_db_id, 'display_ref', v_display_ref)
  );

  RETURN jsonb_build_object(
    'success', true,
    'bookingId', v_booking_db_id,
    'displayId', v_display_ref
  );
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Booking creation transaction failed: %', SQLERRM;
END;
$$;
