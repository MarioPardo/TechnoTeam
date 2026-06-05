export default function CrewSearchPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-3">Crew Search</h1>
      <p className="text-muted-foreground text-lg mb-8">Look for festival groups!</p>

      <div className="border-2 border-dashed border-border rounded-2xl p-12">
        <p className="text-muted-foreground font-medium mb-4">Coming soon — you'll be able to search by:</p>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="text-primary font-bold">·</span>
            <span><span className="italic">Festival name</span></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary font-bold">·</span>
            <span><span className="italic">Crew name</span></span>
          </li>
        </ul>
      </div>
    </div>
  )
}
