"use client";

export default function NotFound() {
  return (
    <div className={"w-full max-w-7xl grow px-4 pt-10 sm:px-6"}>
      <div className={"bg-background p-8"}>
        <div className="prose dark:prose-invert prose-sm lg:prose-xl">
          <h2>404: Not Found</h2>
          <p>Vi beklager, denne siden finnes ikke.</p>
        </div>
      </div>
    </div>
  );
}
