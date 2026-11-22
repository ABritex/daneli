import { BackLink, PageHero, SectionRule } from "@/components/sections";
import { PostList } from "./post-list";
import { posts } from "./posts";

export function BlogPage() {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <PageHero
        title="Blog"
        intro="Thoughts on design, technology, and the space between."
      />

      <SectionRule />

      <PostList posts={posts} />

      <BackLink />
    </main>
  );
}
