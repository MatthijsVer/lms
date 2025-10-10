import { prisma } from "@/lib/db";
// import { env } from "@/lib/env";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();

  const headersList = await headers();

  const signature = headersList.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook error", { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    try {
      console.log("Processing checkout.session.completed webhook");
      console.log("Session metadata:", session.metadata);
      
      const courseId = session.metadata?.courseId;
      const enrollmentId = session.metadata?.enrollmentId;
      const customerId = session.customer as string;

      if (!courseId) {
        console.error("Course id not found in metadata");
        return new Response("Course id not found", { status: 400 });
      }

      if (!enrollmentId) {
        console.error("Enrollment id not found in metadata");
        return new Response("Enrollment id not found", { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: {
          stripeCustomerId: customerId,
        },
      });

      if (!user) {
        console.error("User not found for customerId:", customerId);
        return new Response("User not found", { status: 400 });
      }

      console.log("Updating enrollment:", enrollmentId, "for user:", user.id);

      const updatedEnrollment = await prisma.enrollment.update({
        where: {
          id: enrollmentId,
        },
        data: {
          userId: user.id,
          courseId: courseId,
          amount: session.amount_total || 0, // Keep in cents to match the database
          status: "Active",
        },
      });

      console.log("Enrollment updated successfully:", updatedEnrollment);
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response("Internal error", { status: 500 });
    }
  }

  return new Response(null, { status: 200 });
}
