export default function GlobalHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-hero-gradient">
      <div className="max-w-sm mx-auto px-5 h-14 flex items-center">
        <div>
          <h1 className="text-primary-foreground font-bold text-base leading-none font-condensed tracking-wide">
            ShopBot
          </h1>
          <p className="text-primary-foreground/65 text-[10px] font-medium mt-0.5">Mini Store</p>
        </div>
      </div>
    </header>
  );
}
