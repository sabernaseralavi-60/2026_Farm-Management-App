import type { Metadata } from "next";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import "nextra-theme-docs/style.css";

export const metadata: Metadata = {
  title: {
    default: "مستندات سامانه مدیریت مزرعه حسین‌آباد شهکل",
    template: "%s – مستندات مزرعه شهکل",
  },
  description: "معرفی، معماری و راهنمای کاربری سامانه مدیریت مزرعه حسین‌آباد شهکل.",
};

const navbar = (
  <Navbar
    logo={
      <span style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
        🌴 مزرعه حسین‌آباد شهکل
      </span>
    }
    projectLink="https://github.com/sabernaseralavi-60/2026_Farm-Management-App"
  />
);

const footer = (
  <Footer>
    <span>© {new Date().getFullYear()} سامانه مدیریت مزرعه حسین‌آباد شهکل · شهرستان ریگان</span>
  </Footer>
);

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pageMap = await getPageMap();
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={pageMap}
          docsRepositoryBase="https://github.com/sabernaseralavi-60/2026_Farm-Management-App/tree/main/apps/docs"
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          editLink="ویرایش این صفحه در گیت‌هاب"
          feedback={{ content: "بازخورد یا سوالی دارید؟" }}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
