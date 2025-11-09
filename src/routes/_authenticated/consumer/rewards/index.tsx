import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authComponent } from "../../../../../convex/auth";
import { ConsumerLayout } from "@/components/consumer/ConsumerLayout";

export const Route = createFileRoute("/_authenticated/consumer/rewards/")({
  component: RewardsPage,
});

function RewardsPage() {
  // TODO: Create queries for active and completed rewards
  const activeRewards: any[] = [];
  const completedRewards: any[] = [];

  return (
    <ConsumerLayout>
      <div className="p-6">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-6">
            {activeRewards.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <p>No active rewards yet</p>
                  <p className="text-sm mt-2">Keep shopping to earn rewards!</p>
                </CardContent>
              </Card>
            ) : (
              activeRewards.map((reward) => (
                <Card key={reward._id}>
                  <CardHeader>
                    <CardTitle>{reward.businessName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {reward.programName}
                    </p>
                    <p className="font-medium mb-4">{reward.rewardDescription}</p>
                    <Button className="w-full">Claim Reward</Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-6">
            {completedRewards.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <p>No completed rewards yet</p>
                </CardContent>
              </Card>
            ) : (
              completedRewards.map((reward) => (
                <Card key={reward._id}>
                  <CardHeader>
                    <CardTitle>{reward.businessName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Earned: {reward.completedDate}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ConsumerLayout>
  );
}

