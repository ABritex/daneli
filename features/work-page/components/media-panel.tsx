import { FADE_ATTR } from "@/features/works";

const PANEL = "w-full md:w-[min(86vw,calc(62vh*1.6))] aspect-[16/10]";
const MB = { filter: "blur(var(--mb, 0px))" } as const;

type MediaPanelProps = {
  children: React.ReactNode;
  sectionClassName: string;
};

export function MediaPanel({ children, sectionClassName }: MediaPanelProps) {
  return (
    <section className={sectionClassName}>
      <div data-pop="" className="w-full will-change-transform">
        <div
          {...{ [FADE_ATTR]: "" }}
          className={`relative ${PANEL} overflow-hidden bg-[#111]`}
          style={{ borderRadius: 6, ...MB }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
