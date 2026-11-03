export default function Loading() {
  return <main className="min-h-screen bg-cream px-4 py-5 sm:px-6 sm:py-7">
    <div className="mx-auto flex max-w-6xl items-center justify-between"><div className="h-7 w-28 animate-pulse rounded bg-zinc-200" /><div className="h-4 w-20 animate-pulse rounded bg-zinc-200" /></div>
    <section className="mx-auto max-w-6xl py-16 sm:py-24 md:py-32"><div className="h-3 w-48 animate-pulse rounded bg-terracotta/20" /><div className="mt-6 h-16 w-72 animate-pulse rounded bg-zinc-200 sm:h-24 sm:w-96" /><div className="mt-8 h-5 w-full max-w-md animate-pulse rounded bg-zinc-200" /></section>
    <section className="mx-auto grid max-w-6xl gap-8 bg-white p-5 shadow-soft md:grid-cols-[.8fr_1.2fr] md:p-12"><div><div className="h-3 w-32 animate-pulse rounded bg-zinc-200" /><div className="mt-4 h-10 w-48 animate-pulse rounded bg-zinc-200" /></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded bg-zinc-100" />)}</div></section>
  </main>;
}
