import ModelManager from "./translation/ModelManager";
import AppButton from "../common/components/ui/button";

export default function DesktopApp() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-8">
      <h1 className="text-3xl font-bold">desktop-voice-translater</h1>
      <AppButton lang="en">test</AppButton>
      <AppButton lang="jp">テスト</AppButton>
      <AppButton lang="kr">테스트</AppButton>
      <AppButton lang="zh">测试</AppButton>
      <ModelManager />
    </main>
  );
}
