"use client";

export default function NotFound() {
  return (
    <div className={"w-full max-w-5xl px-2"}>
      <div className={"bg-background p-8 rounded-lg shadow-lg"}>
        <div className="prose-sm lg:prose-xl">
          <h2>404: Not Found</h2>
          <p>Vi beklager, denne siden finnes ikke.</p>
        </div>
      </div>
    </div>
  );
}
