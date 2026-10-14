/** For secret-location events, venue is null and venueHint may give the area. */
export type PublicVenue = { venue: string | null; venueHidden: boolean; venueHint: string | null };

export type PublicEvent = PublicVenue & {
  id: string;
  title: string;
  slug: string;
  startsAt: string;
  endsAt: string | null;
  coverImageUrl: string | null;
  minPrice: number | null;
  soldOut: boolean;
  ticketsLeft: number;
  capacity: number;
};

export type PublicTicketType = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: number;
  maxPerOrder: number;
};

export type PublicEventDetail = PublicEvent & {
  description: string;
  onSale: boolean;
  ticketTypes: PublicTicketType[];
};

export type OrderStatus = "pending" | "paid" | "cancelled" | "expired";

export type PublicOrder = {
  reference: string;
  status: OrderStatus;
  items: { name: string; unitPrice: number; quantity: number }[];
  total: number;
  expiresAt: string;
  paidAt: string | null;
  ticketsEmailed: boolean;
  buyer: { name: string; email: string };
  event: PublicVenue & { title: string; slug: string | null; startsAt: string | null };
  whatsappUrl: string | null;
};

export type Role = "admin" | "staff";
export type SessionUser = { id: string; name: string; email: string; role: Role };

export type AdminTicketType = {
  id?: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold?: number;
  maxPerOrder: number;
};

export type AdminEvent = {
  id: string;
  title: string;
  slug: string;
  description: string;
  venue: string;
  venueHidden: boolean;
  venueHint: string;
  startsAt: string;
  endsAt: string | null;
  coverImageUrl: string;
  status: "draft" | "published" | "cancelled";
  ticketTypes: (AdminTicketType & { id: string; sold: number })[];
  stats?: { paidTickets: number; pendingTickets: number; revenue: number; checkedIn: number };
};

export type AdminOrder = {
  id: string;
  reference: string;
  status: OrderStatus;
  eventId: string;
  eventTitle: string;
  buyer: { name: string; email: string; phone: string };
  items: { name: string; unitPrice: number; quantity: number }[];
  total: number;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  ticketsEmailedAt: string | null;
  emailError: string | null;
};

export type AdminOrderDetail = AdminOrder & {
  paymentNote?: string;
  cancelReason?: string;
  cancelledAt?: string;
  confirmedByName: string | null;
  cancelledByName: string | null;
  whatsappChatUrl: string;
  tickets: { id: string; shortId: string; ticketTypeName: string; status: "valid" | "used" | "void"; checkedInAt: string | null }[];
};

export type CheckinResult = {
  result: "admitted" | "already_used" | "void" | "wrong_event" | "unpaid" | "invalid";
  ticket?: {
    id: string;
    shortId: string;
    holderName: string;
    ticketTypeName: string;
    orderReference?: string;
    checkedInAt?: string | null;
  };
};
