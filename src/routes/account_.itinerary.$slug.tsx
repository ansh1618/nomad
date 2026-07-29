/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/site/AuthContext';
import {
  getPackageDocumentBySlugFn,
  getItineraryPdfSignedUrlFn,
  logPdfViewStartFn,
  updatePdfViewHeartbeatFn,
} from '@/lib/itinerary-pdf-fns';
import { LuxuryPdfViewer } from '@/components/site/LuxuryPdfViewer';

export const Route = createFileRoute('/account_/itinerary/$slug')({
  validateSearch: (search: Record<string, unknown>): { type?: string } => ({
    type: search.type as string | undefined,
  }),
  component: ItineraryViewerPage,
});

function ItineraryViewerPage() {
  const { slug } = Route.useParams();
  const { type = 'ITINERARY' } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [viewSessionId, setViewSessionId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      sessionStorage.setItem("auth_redirect_target", `/account/itinerary/${slug}?type=${type}`);
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, slug, type, navigate]);

  // Fetch document metadata
  const { data: documentMeta, isLoading: loadingMeta, refetch } = useQuery({
    queryKey: ['package_document_view', slug, type],
    queryFn: () => getPackageDocumentBySlugFn({ data: { slug, type: type as any } }),
    enabled: !!slug && isAuthenticated,
  });

  // Generate 1-hour signed URL when metadata is fetched
  const fetchUrl = () => {
    if (!documentMeta) return;
    const fileUrl = documentMeta?.storage_path || documentMeta?.file_url;
    if (fileUrl) {
      setLoadingUrl(true);
      getItineraryPdfSignedUrlFn({ data: fileUrl })
        .then((url) => setSignedUrl(url))
        .catch(() => setSignedUrl(fileUrl))
        .finally(() => setLoadingUrl(false));
    } else {
      setSignedUrl(null);
      setLoadingUrl(false);
    }
  };

  useEffect(() => {
    fetchUrl();
  }, [documentMeta]);

  // Analytics logging
  useEffect(() => {
    if (documentMeta && documentMeta.id && !documentMeta.is_missing) {
      logPdfViewStartFn({
        data: {
          user_id: user?.id || null,
          package_id: documentMeta.package_id,
          document_id: documentMeta.id,
          device: navigator.userAgent.includes('Mobi') ? 'Mobile' : 'Desktop',
          browser: navigator.userAgent.split(' ').pop() || 'Browser',
        },
      })
        .then((res) => {
          if (res?.viewId) setViewSessionId(res.viewId);
        })
        .catch(console.error);
    }
  }, [documentMeta, user]);

  // Analytics heartbeats timer
  useEffect(() => {
    if (!viewSessionId) return;

    const timer = setInterval(() => {
      updatePdfViewHeartbeatFn({
        data: {
          viewId: viewSessionId,
          last_page_viewed: 1,
          max_page_reached: 1,
          progress_percent: 50,
          reading_time: 10,
          completed: false,
        },
      }).catch(console.error);
    }, 15000);

    return () => clearInterval(timer);
  }, [viewSessionId]);

  const destinationName = documentMeta?.journey_name || slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

  return (
    <LuxuryPdfViewer
      signedUrl={signedUrl}
      isLoadingUrl={loadingMeta || loadingUrl}
      destinationName={destinationName}
      slug={slug}
      documentMeta={documentMeta}
      onClose={() => navigate({ to: '/account' })}
      onBookClick={() => navigate({ to: `/journey/${slug}` })}
      onRetry={() => {
        refetch();
        fetchUrl();
      }}
    />
  );
}
