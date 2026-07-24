// app/user/notifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Check,
  Clock,
  Bell,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { notificationEvents } from "@/lib/notification-events";

interface Notification {
  id: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter === "unread") params.set("unread", "true");
      
      const response = await fetch(`/api/user/notifications?${params}`);
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/user/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });

      if (!response.ok) throw new Error("Failed to mark as read");

      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
        )
      );
      
      // ✅ Emit event untuk refresh sidebar
      notificationEvents.emit('refresh');
      
      toast.success("Marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/user/notifications/mark-all-read", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to mark all as read");

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      
      // ✅ Emit event untuk refresh sidebar
      notificationEvents.emit('refresh');
      
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/user/notifications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete notification");

      setNotifications(prev => prev.filter(n => n.id !== id));
      
      // ✅ Emit event untuk refresh sidebar
      notificationEvents.emit('refresh');
      
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "WARNING":
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case "ERROR":
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; className: string }> = {
      INFO: { label: "Info", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      SUCCESS: { label: "Success", className: "bg-green-500/20 text-green-400 border-green-500/30" },
      WARNING: { label: "Warning", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
      ERROR: { label: "Error", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    };
    const info = typeMap[type] || typeMap.INFO;
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Bell className="h-6 w-6 text-white/60" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white border-red-500">
                {unreadCount} new
              </Badge>
            )}
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Stay updated with your project activities
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              size="sm"
              className="border-white/10 text-white hover:bg-white/10"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
          <Button
            onClick={fetchNotifications}
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className={filter === "all" ? "bg-white text-black hover:bg-white/90" : "border-white/10 text-white hover:bg-white/10"}
        >
          All
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
          className={filter === "unread" ? "bg-white text-black hover:bg-white/90" : "border-white/10 text-white hover:bg-white/10"}
        >
          <Eye className="h-4 w-4 mr-2" />
          Unread
          {unreadCount > 0 && (
            <Badge className="ml-1 bg-red-500 text-white border-red-500 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </Button>
        <Button
          variant={filter === "read" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("read")}
          className={filter === "read" ? "bg-white text-black hover:bg-white/90" : "border-white/10 text-white hover:bg-white/10"}
        >
          <EyeOff className="h-4 w-4 mr-2" />
          Read
        </Button>
      </div>

      {/* Notifications List */}
      <Card className="bg-black/40 border-white/10 overflow-hidden">
        <CardHeader className="pb-3 border-b border-white/5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base font-semibold">
              Notifications
            </CardTitle>
            <CardDescription className="text-white/40 text-xs">
              {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2.5 text-sm text-white/40">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-white/60" />
                Loading notifications...
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Bell className="h-12 w-12 text-white/20" />
              <p className="text-sm font-medium text-white/50">No notifications</p>
              <p className="text-xs text-white/30">
                {filter === "all" 
                  ? "You're all caught up!" 
                  : filter === "unread" 
                    ? "No unread notifications" 
                    : "No read notifications"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group flex items-start gap-4 rounded-lg p-4 transition-all duration-150 ${
                    !notification.read
                      ? "bg-white/5 border border-white/10"
                      : "bg-transparent hover:bg-white/5"
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-medium text-white">
                        {notification.title}
                      </h4>
                      {getTypeBadge(notification.type)}
                      {!notification.read && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-white/60 mt-0.5">
                      {notification.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="text-xs text-white/30">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                      {notification.link && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-white/40 hover:text-white"
                          onClick={() => router.push(notification.link!)}
                        >
                          View Details →
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-7 w-7 p-0 text-white/40 hover:text-white hover:bg-white/10"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="h-7 w-7 p-0 text-white/20 hover:text-red-400 hover:bg-red-500/10"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}