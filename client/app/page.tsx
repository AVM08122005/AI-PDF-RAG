import Chat from "./components/Chat";
import Fileupload from "./components/Fileupload";

export default function Home() {
  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <div className="w-[30%] flex h-screen cursor-pointer p-4 justify-center items-center bg-slate-50 border-r-2 border-slate-200">
        <Fileupload/>
      </div>

      <div className="w-[70%] h-screen">
        <Chat/>
      </div>
    </div>
  );
}