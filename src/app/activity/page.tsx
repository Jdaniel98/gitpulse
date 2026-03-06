"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GitCommitHorizontal,
  GitPullRequest,
  CircleDot,
  MessageSquare,
  Star,
  GitFork,
  PenLine,
  ExternalLink,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Contribution, ContributionType } from "@/lib/types";
import { typeConfig } from "@/lib/contribution-utils";
import { formatDistanceToNow, format } from "date-fns";

const typeIcons: Record<ContributionType, React.ElementType> = {
  commit: GitCommitHorizontal,
  pr: GitPullRequest,
  issue: CircleDot,
  review: MessageSquare,
  star: Star,
  fork: GitFork,
  manual: PenLine,
};

const PAGE_SIZE = 20;

export default function ActivityPage() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [repos, setRepos] = useState<string[]>([]);
  const [repoFilter, setRepoFilter] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [typeFilter, searchDebounced, repoFilter]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (searchDebounced) params.set("search", searchDebounced);
      if (repoFilter !== "all") params.set("repo", repoFilter);

      const res = await fetch(`/api/contributions?${params}`);
      const data = await res.json();
      setContributions(data.data);
      setTotal(data.total);
      setLoading(false);
    };
    fetchData();

    const handler = () => { setPage(0); fetchData(); };
    window.addEventListener("contributions-updated", handler);
    return () => window.removeEventListener("contributions-updated", handler);
  }, [page, typeFilter, searchDebounced, repoFilter]);

  useEffect(() => {
    fetch("/api/contributions?limit=1000")
      .then((r) => r.json())
      .then((data) => {
        const repoSet = new Set<string>();
        data.data.forEach((c: Contribution) => {
          if (c.repo) repoSet.add(c.repo);
        });
        setRepos([...repoSet].sort());
      });
  }, []);

  const handleDelete = async (id: number) => {
    await fetch("/api/contributions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setContributions((prev) => prev.filter((c) => c.id !== id));
    setTotal((prev) => prev - 1);
    window.dispatchEvent(new Event("contributions-updated"));
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <Header title="Activity Feed" />
      <div className="space-y-4 p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search contributions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="commit">Commits</SelectItem>
              <SelectItem value="pr">Pull Requests</SelectItem>
              <SelectItem value="issue">Issues</SelectItem>
              <SelectItem value="review">Reviews</SelectItem>
              <SelectItem value="star">Stars</SelectItem>
              <SelectItem value="fork">Forks</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
          {repos.length > 0 && (
            <Select value={repoFilter} onValueChange={setRepoFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All repos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All repos</SelectItem>
                {repos.map((repo) => (
                  <SelectItem key={repo} value={repo}>
                    {repo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {total} contribution{total !== 1 ? "s" : ""} found
        </p>

        {/* Activity list */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : contributions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No contributions found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {contributions.map((c) => {
              const config = typeConfig[c.type];
              const Icon = typeIcons[c.type] || PenLine;
              return (
                <Card key={c.id} className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{c.title}</p>
                        <div className="flex shrink-0 items-center gap-1">
                          {c.url && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                              <a href={c.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(c.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {c.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {c.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                          {config.label}
                        </Badge>
                        {c.repo && (
                          <span className="text-xs text-muted-foreground">{c.repo}</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(c.created_at), "MMM d, yyyy")} ({formatDistanceToNow(new Date(c.created_at), { addSuffix: true })})
                        </span>
                        {c.source === "manual" && (
                          <Badge variant="secondary" className="text-[10px]">manual</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
