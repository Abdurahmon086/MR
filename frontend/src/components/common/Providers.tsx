"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, App } from "antd";
import { useState } from "react";
import I18nProvider from "./I18nProvider";

const antdTheme = {
  token: {
    colorPrimary: "#1890FF",
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#ff4d4f",
    borderRadius: 8,
    fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`,
  },
  components: {
    Layout: { siderBg: "#001529", headerBg: "#fff" },
    Menu: { darkItemBg: "#001529", darkSubMenuItemBg: "#000c17" },
  },
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } } })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={antdTheme}>
        <App>
          <I18nProvider>{children}</I18nProvider>
        </App>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
