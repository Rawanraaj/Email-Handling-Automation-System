import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Search, Star, Archive, Trash2, Reply, Copy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Compose from "./Compose";

type Category = "Work" | "Personal" | "Promotions" | "Urgent" | "Other";

const CATEGORY_COLORS: Record<Category, string> = {
  Work: "email-category-work",
  Personal: "email-category-personal",
  Promotions: "email-category-promotions",
  Urgent: "email-category-urgent",
  Other: "email-category-other",
};

export default function Inbox() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const { data: emails, isLoading, refetch } = trpc.emails.getAll.useQuery({ limit: 50 });

  // Sync emails on component mount
  useEffect(() => {
    refetch();
  }, []);

  const { data: selectedEmail } = selectedEmailId
    ? trpc.emails.getById.useQuery({ id: selectedEmailId })
    : { data: null };

  const updateMutation = trpc.emails.update.useMutation();
  const categorizeMutation = trpc.ai.categorizeEmail.useMutation();
  const summarizeMutation = trpc.ai.summarizeEmail.useMutation();
  const repliesMutation = trpc.ai.generateReplies.useMutation();

  const filteredEmails = emails?.filter((email: any) => {
    if (selectedCategory !== "all" && email.category !== selectedCategory) return false;
    if (searchQuery && !email.subject?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleMarkRead = (emailId: number, isRead: boolean) => {
    updateMutation.mutate({ id: emailId, isRead: !isRead });
  };

  const handleStar = (emailId: number, isStarred: boolean) => {
    updateMutation.mutate({ id: emailId, isStarred: !isStarred });
  };

  const handleCategorize = (emailId: number) => {
    categorizeMutation.mutate({ emailId });
  };

  const handleSummarize = (emailId: number) => {
    summarizeMutation.mutate({ emailId });
  };

  const handleGenerateReplies = (emailId: number) => {
    repliesMutation.mutate({ emailId });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inbox</h1>
            <p className="text-muted-foreground mt-1">Manage your emails with AI-powered intelligence</p>
          </div>
          <Button className="gap-2" onClick={() => setIsComposeOpen(true)}>
            <Mail className="w-4 h-4" />
            Compose
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "Work", "Personal", "Promotions", "Urgent", "Other"] as const).map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === "all" ? "All" : cat}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center h-96">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredEmails && filteredEmails.length > 0 ? (
                <div className="divide-y divide-border">
                  {filteredEmails.map((email: any) => (
                    <div
                      key={email.id}
                      className={`email-list-item ${email.isRead ? "" : "unread"}`}
                      onClick={() => setSelectedEmailId(email.id)}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStar(email.id, !!email.isStarred);
                          }}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Star
                            className={`w-4 h-4 ${email.isStarred ? "fill-current text-yellow-500" : ""}`}
                          />
                        </button>
                        <input type="checkbox" className="rounded" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className={`font-medium truncate ${email.isRead ? "" : "font-bold"}`}>
                            {email.senderName || email.from}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(email.receivedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${email.isRead ? "text-muted-foreground" : "font-medium"}`}>
                          {email.subject}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`email-category-badge ${CATEGORY_COLORS[email.category as Category]}`}>
                            {email.category}
                          </Badge>
                          {email.aiScore && email.aiScore > 70 && (
                            <div className={`priority-score ${email.aiScore > 85 ? "priority-high" : "priority-medium"}`}>
                              {Math.round(email.aiScore / 10)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                  <Mail className="w-12 h-12 mb-4 opacity-50" />
                  <p>No emails found</p>
                </div>
              )}
            </Card>
          </div>

          {/* Email Detail Panel */}
          <div className="lg:col-span-1">
            {selectedEmail ? (
              <Card className="p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-lg mb-2">{selectedEmail.subject}</h3>
                  <p className="text-sm text-muted-foreground">
                    From: <span className="font-medium text-foreground">{selectedEmail.senderName || selectedEmail.from}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(selectedEmail.receivedAt).toLocaleString()}
                  </p>
                </div>

                <div className="divider" />

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Category</p>
                  <Badge className={`email-category-badge ${CATEGORY_COLORS[selectedEmail.category as Category]}`}>
                    {selectedEmail.category}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleMarkRead(selectedEmail.id, !!selectedEmail.isRead)}
                  >
                    {selectedEmail.isRead ? "Mark as Unread" : "Mark as Read"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleSummarize(selectedEmail.id)}
                    disabled={summarizeMutation.isPending}
                  >
                    {summarizeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Summarizing...
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Summarize
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleGenerateReplies(selectedEmail.id)}
                    disabled={repliesMutation.isPending}
                  >
                    {repliesMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Reply className="w-4 h-4" />
                        Reply Suggestions
                      </>
                    )}
                  </Button>

                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Archive className="w-4 h-4" />
                    Archive
                  </Button>

                  <Button variant="outline" size="sm" className="w-full gap-2 text-destructive">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-6 flex items-center justify-center h-96 text-muted-foreground">
                <p>Select an email to view details</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      <Compose open={isComposeOpen} onOpenChange={setIsComposeOpen} />
    </DashboardLayout>
  );
}

