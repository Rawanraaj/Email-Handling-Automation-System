import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface RuleFormData {
  name: string;
  conditionType: "from" | "subject" | "to";
  conditionValue: string;
  actionType: "label" | "archive" | "star";
  actionValue: string;
}

export default function Settings() {
  const { data: rules, isLoading, refetch } = trpc.rules.getAll.useQuery();
  const createMutation = trpc.rules.create.useMutation();
  const deleteMutation = trpc.rules.delete.useMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<RuleFormData>({
    name: "",
    conditionType: "from",
    conditionValue: "",
    actionType: "label",
    actionValue: "",
  });

  const handleCreateRule = async () => {
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        conditions: {
          [formData.conditionType]: formData.conditionValue,
        },
        actions: {
          [formData.actionType]: formData.actionValue,
        },
      });
      setFormData({
        name: "",
        conditionType: "from",
        conditionValue: "",
        actionType: "label",
        actionValue: "",
      });
      setIsOpen(false);
      refetch();
    } catch (error) {
      console.error("Failed to create rule:", error);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    try {
      await deleteMutation.mutateAsync({ id: ruleId });
      refetch();
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage automation rules and preferences</p>
          </div>
        </div>

        {/* Automation Rules */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Automation Rules</h2>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Automation Rule</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Rule Name</label>
                    <Input
                      placeholder="e.g., Work Emails"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Condition Type</label>
                      <Select value={formData.conditionType} onValueChange={(value: any) => setFormData({ ...formData, conditionType: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="from">From</SelectItem>
                          <SelectItem value="subject">Subject</SelectItem>
                          <SelectItem value="to">To</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Condition Value</label>
                      <Input
                        placeholder="e.g., boss@company.com"
                        value={formData.conditionValue}
                        onChange={(e) => setFormData({ ...formData, conditionValue: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Action Type</label>
                      <Select value={formData.actionType} onValueChange={(value: any) => setFormData({ ...formData, actionType: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="label">Label</SelectItem>
                          <SelectItem value="archive">Archive</SelectItem>
                          <SelectItem value="star">Star</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Action Value</label>
                      <Input
                        placeholder="e.g., Important"
                        value={formData.actionValue}
                        onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateRule}
                    disabled={createMutation.isPending || !formData.name || !formData.conditionValue}
                    className="w-full"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Rule"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : rules && rules.length > 0 ? (
            <div className="space-y-3">
              {rules.map((rule: any) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium">{rule.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {rule.condition?.type === "from" && `From: ${rule.condition?.value}`}
                      {rule.condition?.type === "subject" && `Subject contains: ${rule.condition?.value}`}
                      {rule.condition?.type === "to" && `To: ${rule.condition?.value}`}
                      {" → "}
                      {rule.action?.type === "label" && `Label: ${rule.action?.value}`}
                      {rule.action?.type === "archive" && "Archive"}
                      {rule.action?.type === "star" && "Star"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" disabled>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p>No rules created yet</p>
              <p className="text-sm">Create your first rule to automate email management</p>
            </div>
          )}
        </Card>

        {/* Notification Settings */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium">Urgent Email Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when urgent emails arrive</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium">High Priority Emails</p>
                <p className="text-sm text-muted-foreground">Notify on high-priority emails</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium">Daily Summary</p>
                <p className="text-sm text-muted-foreground">Receive daily email summary</p>
              </div>
              <input type="checkbox" className="w-5 h-5 rounded" />
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
