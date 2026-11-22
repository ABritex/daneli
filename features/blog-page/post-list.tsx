import type { Post } from "./posts";

export function PostList({ posts }: { posts: Post[] }) {
  return (
    <section className="px-8 py-20 md:px-16 lg:px-24">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid grid-cols-1 gap-0">
          {posts.map((post, i) => (
            <article key={post.title} className="border-t border-foreground/30 py-8 group cursor-pointer">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-baseline">
                <div className="md:col-span-1">
                  <span className="text-xs opacity-50">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="md:col-span-6">
                  <h2 className="text-2xl font-medium tracking-tight group-hover:opacity-70 transition-opacity">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70 max-w-xl">
                    {post.excerpt}
                  </p>
                </div>
                <div className="md:col-span-3 md:text-right">
                  <span className="text-xs uppercase tracking-[0.2em] opacity-50">{post.date}</span>
                </div>
                <div className="md:col-span-2 md:text-right">
                  <span className="text-xs uppercase tracking-[0.2em] opacity-50">{post.read} read</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
