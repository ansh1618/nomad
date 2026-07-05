import { Reveal } from "./Reveal";
import bali from "@/assets/dest-bali.jpg";
import dubai from "@/assets/dest-dubai.jpg";
import thailand from "@/assets/dest-thailand.jpg";
import kashmir from "@/assets/dest-kashmir.jpg";
import goa from "@/assets/dest-goa.jpg";
import manali from "@/assets/dest-manali.jpg";
import honeymoon from "@/assets/pkg-honeymoon.jpg";
import adventure from "@/assets/pkg-adventure.jpg";

const images = [
  { src: kashmir, alt: "Kashmir Dal lake", label: "Kashmir" },
  { src: dubai, alt: "Dubai skyline", label: "Dubai" },
  { src: thailand, alt: "Thailand beach", label: "Thailand" },
  { src: honeymoon, alt: "Maldives honeymoon", label: "Maldives" },
  { src: bali, alt: "Bali temples", label: "Bali" },
  { src: goa, alt: "Goa sunset", label: "Goa" },
  { src: adventure, alt: "Mountain adventure", label: "Adventure" },
  { src: manali, alt: "Manali mountains", label: "Manali" },
];

export function Gallery() {
  return (
    <section id="gallery" className="mx-auto max-w-7xl px-5 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-bold uppercase tracking-[0.2em] text-gold">Moments</span>
        <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
          Travel Gallery
        </h2>
        <p className="mt-4 text-muted-foreground">
          Real destinations, real magic — captured from our journeys around the world.
        </p>
      </Reveal>

      <Reveal className="mt-14">
        <div className="columns-2 gap-4 [column-fill:_balance] md:columns-3 lg:columns-4">
          {images.map((img, i) => (
            <figure
              key={img.label + i}
              className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl shadow-soft"
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-400 group-hover:opacity-100">
                <figcaption className="p-4 font-display text-lg font-bold text-white">
                  {img.label}
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
