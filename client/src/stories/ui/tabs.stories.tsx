import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tabs } from "../../common/components/ui/tabs";

function TabsExample() {
  return (
    <Tabs className="w-full max-w-lg" orientation="vertical" variant="secondary">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Preferences">
          <Tabs.Tab id="conversation">
            会話
            <Tabs.Indicator className="bg-primary" />
          </Tabs.Tab>
          <Tabs.Tab id="study">
            学習
            <Tabs.Indicator className="bg-primary" />
          </Tabs.Tab>
          <Tabs.Tab id="settings">
            設定
            <Tabs.Indicator className="bg-primary" />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}

const meta = {
  title: "HeroUI/Tabs",
  component: TabsExample,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof TabsExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
