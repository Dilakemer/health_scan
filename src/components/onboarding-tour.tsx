"use client";

import { useEffect, useState, Suspense } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { tr } from "@/i18n/tr";

interface OnboardingTourProps {
  page: "home" | "dashboard" | "scan";
}

function TourContent({ page }: OnboardingTourProps) {
  const [mounted, setMounted] = useState(false);
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const tourKey = `healthscan_tour_${page}_v5_scan`; // Incrementing version to include Scan page tour
    const hasSeenTour = localStorage.getItem(tourKey);
    const forceTour = searchParams.get("tour") === "true";

    if (hasSeenTour && !forceTour) {
      setRun(false);
      return;
    }

    const tourSteps: Step[] =
      page === "home"
        ? [
            {
              target: "body",
              content: tr.tour.home.intro,
              title: tr.tour.home.introTitle,
              placement: "center",
            },
            {
              target: "#tour-home-start",
              content: tr.tour.home.start,
              title: tr.tour.home.startTitle,
              disableBeacon: true,
            },
            {
              target: "#tour-home-steps",
              content: tr.tour.home.steps,
              title: tr.tour.home.stepsTitle,
            },
            {
              target: "#tour-home-cta",
              content: tr.tour.home.cta,
              title: tr.tour.home.ctaTitle,
            },
          ]
        : page === "dashboard"
          ? [
            {
              target: "body",
              content: tr.tour.dashboard.intro,
              title: tr.tour.dashboard.introTitle,
              placement: "center",
            },
            {
              target: "#tour-dashboard-stats",
              content: tr.tour.dashboard.stats,
              title: tr.tour.dashboard.statsTitle,
              disableBeacon: true,
            },
            {
              target: "#tour-dashboard-profile",
              content: tr.tour.dashboard.profile,
              title: tr.tour.dashboard.profileTitle,
            },
            {
              target: "#tour-dashboard-history",
              content: tr.tour.dashboard.history,
              title: tr.tour.dashboard.historyTitle,
            },
            {
              target: "#tour-dashboard-new-scan",
              content: tr.tour.dashboard.newScan,
              title: tr.tour.dashboard.newScanTitle,
            },
          ]
        : [
            {
              target: "body",
              content: tr.tour.scan.intro,
              title: tr.tour.scan.introTitle,
              placement: "center",
            },
            {
              target: "#tour-scan-upload",
              content: tr.tour.scan.upload,
              title: tr.tour.scan.uploadTitle,
              disableBeacon: true,
            },
            {
              target: "#tour-scan-ocr",
              content: tr.tour.scan.ocr,
              title: tr.tour.scan.ocrTitle,
            },
            {
              target: "#tour-scan-name",
              content: tr.tour.scan.name,
              title: tr.tour.scan.nameTitle,
            },
            {
              target: "#tour-scan-analyze",
              content: tr.tour.scan.analyze,
              title: tr.tour.scan.analyzeTitle,
            },
            {
              target: "#tour-scan-preview",
              content: tr.tour.scan.preview,
              title: tr.tour.scan.previewTitle,
            },
            {
              target: "#tour-scan-categories",
              content: tr.tour.scan.categories,
              title: tr.tour.scan.categoriesTitle,
            },
          ];

    setSteps(tourSteps);

    const timer = setTimeout(() => {
      setRun(true);
    }, forceTour ? 100 : 800);

    return () => clearTimeout(timer);
  }, [page, searchParams.get("tour"), mounted]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem(`healthscan_tour_${page}_v_final`, "true");
      
      // Clear the query param if it exists to allow repeated button clicks
      if (searchParams.get("tour") === "true") {
        router.replace(pathname);
      }
    }
  };

  if (!mounted) return null;

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "#10b981", // emerald-500
          textColor: "#334155", // slate-700
          backgroundColor: "#ffffff",
          overlayColor: "rgba(0, 0, 0, 0.5)",
        },
        buttonClose: {
          display: "none",
        },
        buttonSkip: {
          color: "#64748b", // slate-500
        },
        buttonNext: {
          backgroundColor: "#10b981",
          borderRadius: "8px",
        },
        buttonBack: {
          color: "#10b981",
        },
      }}
      locale={{
        back: tr.tour.back,
        close: tr.tour.close,
        last: tr.tour.last,
        next: tr.tour.next,
        skip: tr.tour.skip,
      }}
    />
  );
}

export function OnboardingTour(props: OnboardingTourProps) {
  return (
    <Suspense fallback={null}>
      <TourContent {...props} />
    </Suspense>
  );
}
