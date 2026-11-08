import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, BookOpen, Mic, Settings } from "lucide-react";
import { Tabs } from "../common/components/ui/tabs";

const items = [
  { to: "/conversation", label: "会話", icon: MessageCircle },
  { to: "/study", label: "学習", icon: BookOpen },
  { to: "/sound-clone", label: "声を生成", icon: Mic },
  { to: "/settings", label: "設定", icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedTab =
    items.find(
      ({ to }) =>
        location.pathname === to ||
        (to === "/settings" && location.pathname.startsWith("/settings/")),
    )?.to ?? "/conversation";

  return (
    <aside className="w-52 shrink-0 border-r border-[#DDEBE8] bg-white p-4">
      <h1 className="mt-2 mb-8 px-6 text-3xl font-bold">翻訳丸</h1>

      <nav>
        <Tabs
          className="w-full max-w-lg [&>.tabs__list-container]:border-0"
          align="start"
          orientation="vertical"
          selectedKey={selectedTab}
          onSelectionChange={(key) => navigate(String(key))}
          variant="secondary"
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Preferences" className="gap-4">
              {items.map(({ to, label, icon: Icon }) => (
                <Tabs.Tab
                  className="flex w-full justify-start rounded-2xl px-6 py-6 text-left text-xl text-[#687A99] data-[selected=true]:font-semibold data-[selected=true]:text-[#168B73]"
                  id={to}
                  key={to}
                >
                  <div className="flex w-full items-center justify-start gap-3">
                    <Icon aria-hidden="true" size={32} />
                    {label}
                    {to === selectedTab && (
                      <Tabs.Indicator className="bg-primary" />
                    )}
                  </div>
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </nav>
    </aside>
  );
}
