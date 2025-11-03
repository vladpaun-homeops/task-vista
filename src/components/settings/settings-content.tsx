'use client';

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export function SettingsContent() {
  const [defaultView, setDefaultView] = React.useState<string>("dashboard");
  const [startOfWeek, setStartOfWeek] = React.useState<string>("monday");
  const [emailUpdates, setEmailUpdates] = React.useState<boolean>(true);
  const [pushAlerts, setPushAlerts] = React.useState<boolean>(false);
  const [digestFrequency, setDigestFrequency] = React.useState<string>("weekly");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Default behaviours and layout preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="defaultView">
              Default landing view
            </label>
            <Select value={defaultView} onValueChange={setDefaultView}>
              <SelectTrigger id="defaultView" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
                <SelectItem value="calendar">Calendar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="startWeek">
              Start of the week
            </label>
            <Select value={startOfWeek} onValueChange={setStartOfWeek}>
              <SelectTrigger id="startWeek" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="sunday">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="button" disabled className="mt-4">
            Save preferences (coming soon)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose how you stay informed about task updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="emailUpdates"
              checked={emailUpdates}
              onCheckedChange={(value) => setEmailUpdates(Boolean(value))}
            />
            <div className="space-y-1">
              <label htmlFor="emailUpdates" className="text-sm font-medium">
                Email updates
              </label>
              <p className="text-sm text-muted-foreground">
                Receive a summary when tasks are assigned to you or become overdue.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="pushAlerts"
              checked={pushAlerts}
              onCheckedChange={(value) => setPushAlerts(Boolean(value))}
            />
            <div className="space-y-1">
              <label htmlFor="pushAlerts" className="text-sm font-medium">
                Push alerts
              </label>
              <p className="text-sm text-muted-foreground">
                Get realtime push notifications for mentions and urgent tasks.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="digestFrequency">
              Recap digest
            </label>
            <Select value={digestFrequency} onValueChange={setDigestFrequency}>
              <SelectTrigger id="digestFrequency" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="button" disabled className="mt-4">
            Save notification settings (coming soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
