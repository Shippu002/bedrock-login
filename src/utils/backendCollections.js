function unwrapData(response) {
  if (!response || typeof response !== "object") return response;

  return response.data ?? response;
}

export function extractCollection(response) {
  const payload = unwrapData(response);
  const nestedData =
    payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)
      ? payload.data
      : null;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.apartments)) return payload.apartments;
  if (Array.isArray(payload?.bookings)) return payload.bookings;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.favorites)) return payload.favorites;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  if (Array.isArray(payload?.documents)) return payload.documents;
  if (Array.isArray(payload?.legal)) return payload.legal;
  if (Array.isArray(payload?.legal_documents)) return payload.legal_documents;
  if (Array.isArray(payload?.policies)) return payload.policies;
  if (Array.isArray(payload?.reviews)) return payload.reviews;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.services)) return payload.services;
  if (Array.isArray(payload?.requests)) return payload.requests;
  if (Array.isArray(payload?.request_types)) return payload.request_types;
  if (Array.isArray(payload?.quick_request_types)) {
    return payload.quick_request_types;
  }
  if (Array.isArray(payload?.types)) return payload.types;
  if (Array.isArray(payload?.menu)) return payload.menu;
  if (Array.isArray(payload?.categories)) return payload.categories;
  if (Array.isArray(payload?.meal_types)) return payload.meal_types;
  if (Array.isArray(payload?.dietary_tags)) return payload.dietary_tags;
  if (Array.isArray(nestedData?.requests)) return nestedData.requests;
  if (Array.isArray(nestedData?.request_types)) return nestedData.request_types;
  if (Array.isArray(nestedData?.quick_request_types)) {
    return nestedData.quick_request_types;
  }
  if (Array.isArray(nestedData?.types)) return nestedData.types;
  if (Array.isArray(nestedData?.items)) return nestedData.items;
  if (Array.isArray(nestedData?.products)) return nestedData.products;
  if (Array.isArray(nestedData?.services)) return nestedData.services;

  return [];
}

export function extractObject(response) {
  const payload = unwrapData(response);

  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload
    : {};
}

export function extractLegalDocuments(response) {
  const payload = unwrapData(response);

  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const nested =
    payload.legal ||
    payload.legal_documents ||
    payload.documents ||
    payload.policies ||
    payload.data;

  if (Array.isArray(nested)) return nested;
  if (nested && typeof nested === "object" && nested !== payload) {
    return Object.entries(nested).map(([key, value]) => ({
      ...(value && typeof value === "object" ? value : { value }),
      slug: value?.slug || key,
      type: value?.type || key,
    }));
  }

  return Object.entries(payload).map(([key, value]) => ({
    ...(value && typeof value === "object" ? value : { value }),
    slug: value?.slug || key,
    type: value?.type || key,
  }));
}

export function normalizeBackendResidence(item = {}, index = 0) {
  const title = item.name || item.title || item.residence_name || "Residence";
  const location =
    item.location ||
    [item.city, item.state, item.country].filter(Boolean).join(", ") ||
    item.address ||
    "";

  return {
    backendId: item.id || item.uuid,
    id: normalizeResidenceId(
      item.slug || item.id || `residence-${index + 1}`,
      title,
    ),
    slug: item.slug || "",
    title,
    location,
    image: getImageUrl(item),
    apartments: [],
    raw: item,
  };
}

export function normalizeBackendApartmentCategory(item = {}, index = 0) {
  const bedrooms =
    item.value ??
    item.bedrooms ??
    item.bedroom_count ??
    (String(item.id || "").match(/\d+/)?.[0] || "");
  const name = item.name || item.title || `${bedrooms || index + 1} Bedroom`;

  return {
    id: String(item.id || bedrooms || `category-${index + 1}`),
    name,
    bedrooms: bedrooms === null || bedrooms === "" ? null : Number(bedrooms),
  };
}

function getNestedValue(item, keys) {
  for (const key of keys) {
    const value = key
      .split(".")
      .reduce((current, part) => current?.[part], item);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return "";
}

function getPositiveNumber(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      if (value.length > 0) return value.length;
      continue;
    }

    if (value && typeof value === "object") {
      const nestedValue =
        value.count ??
        value.total ??
        value.quantity ??
        value.value ??
        value.length;
      const nestedNumber = Number(nestedValue);

      if (Number.isFinite(nestedNumber) && nestedNumber > 0) {
        return nestedNumber;
      }

      continue;
    }

    const directNumber = Number(value);

    if (Number.isFinite(directNumber) && directNumber > 0) {
      return directNumber;
    }

    if (typeof value === "string") {
      const cleanedNumber = Number(
        value.replace(/,/g, "").replace(/[^\d.-]/g, ""),
      );

      if (Number.isFinite(cleanedNumber) && cleanedNumber > 0) {
        return cleanedNumber;
      }

      const matchedNumber = Number(value.match(/\d+(\.\d+)?/)?.[0]);

      if (Number.isFinite(matchedNumber) && matchedNumber > 0) {
        return matchedNumber;
      }
    }
  }

  return 0;
}

function getNumberValue(value, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    const parsedValue = Number(
      value.replace(/,/g, "").replace(/[^\d.-]/g, ""),
    );

    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function normalizeResidenceId(value, name = "") {
  const source = String(name || value || "").toLowerCase();

  if (source.includes("opebi")) return "opebi";
  if (source.includes("oduduwa")) return "oduduwa";
  if (source.includes("bateye")) return "bateye";
  if (source.includes("community")) return "community";

  return String(value || name || "residence")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getImageUrl(item) {
  const image = getNestedValue(item, [
    "image",
    "image_url",
    "primary_image",
    "thumbnail",
    "thumbnail_url",
    "featured_image",
    "main_image",
    "cover_image",
    "media.0.url",
    "images.0.url",
    "gallery.0.url",
    "gallery_images.0",
  ]);

  return typeof image === "string" ? image : image?.url || "";
}

function normalizeTags(value, fallback = []) {
  if (Array.isArray(value)) {
    return value
      .map((item) => item?.name || item?.title || item)
      .filter(Boolean)
      .map(String);
  }

  if (typeof value === "string") {
    return value
      .split(/[,|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return fallback;
}

function normalizeBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalized = String(value).trim().toLowerCase();

  if (["false", "0", "no", "unavailable", "inactive"].includes(normalized)) {
    return false;
  }

  return true;
}

function getBackendId(item) {
  return item?.id || item?.uuid || item?.slug || "";
}

function getBedroomCount(item, title) {
  const bedroomValue =
    item.bedrooms ??
    item.bedroom_count ??
    item.no_of_bedrooms ??
    item.category?.bedrooms;
  const titleMatch = String(title || "").match(/(\d+)\s*bed/i);

  return getPositiveNumber(bedroomValue, titleMatch?.[1], 1);
}

export function normalizeBackendApartment(item = {}, index = 0) {
  const residenceName =
    getNestedValue(item, [
      "residence.name",
      "residence.title",
      "residence_name",
      "residenceName",
      "location.name",
    ]) || "Bedrock Residence";
  const residenceId = normalizeResidenceId(
    item.residence_id || item.residenceId || item.residence?.id,
    residenceName,
  );
  const title =
    item.title ||
    item.name ||
    item.apartment_name ||
    item.category?.name ||
    "Apartment";
  const bedrooms = getBedroomCount(item, title);
  const rooms = getPositiveNumber(
    item.room_count,
    item.rooms_count,
    item.no_of_rooms,
    item.number_of_rooms,
    item.total_rooms,
    item.rooms,
    bedrooms,
    1,
  );
  const wifiValue = item.wifi ?? item.has_wifi;
  const amenitiesText = String(item.amenities || "").toLowerCase();

  return {
    backendId: item.id || item.uuid,
    id: String(item.id || item.uuid || item.slug || `backend-${index + 1}`),
    slug: item.slug || "",
    title,
    description:
      item.description ||
      item.summary ||
      item.about ||
      item.short_description ||
      "",
    residenceId,
    residenceName,
    location:
      item.address || item.location || item.area || item.city || residenceName,
    guests: getPositiveNumber(
      item.max_guests,
      item.guest_capacity,
      item.guest_count,
      item.guests,
      1,
    ),
    rooms,
    bedrooms,
    bathrooms: getPositiveNumber(
      item.bathrooms,
      item.bathroom_count,
      item.no_of_bathrooms,
      item.number_of_bathrooms,
    ),
    cars: getPositiveNumber(item.parking_slots, item.cars, item.car_spaces, 1),
    wifi: wifiValue ?? (amenitiesText ? amenitiesText.includes("wifi") : true),
    rating: Number(item.rating ?? item.average_rating ?? 0),
    reviewsCount: Number(
      item.reviews_count ?? item.reviewsCount ?? item.review_count ?? 0,
    ),
    price: Number(
      item.price ||
        item.nightly_rate ||
        item.price_per_night ||
        item.base_nightly_rate ||
        item.discounted_price ||
        item.rate ||
        item.base_price ||
        item.amount ||
        0,
    ),
    cautionFee: getPositiveNumber(
      item.caution_fee,
      item.cautionFee,
      item.refundable_caution_fee,
      item.refundableCautionFee,
      item.security_deposit,
      item.securityDeposit,
      item.refundable_deposit,
      item.refundableDeposit,
      item.deposit,
      item.category?.caution_fee,
      item.category?.cautionFee,
      50000,
    ),
    image: getImageUrl(item),
    available:
      item.available ??
      item.is_available ??
      (item.status ? item.status === "available" : true),
    galleryImages: extractCollection({
      data: item.gallery_images || item.gallery || item.images || [],
    })
      .map((image) =>
        typeof image === "string" ? image : image?.url || image?.src,
      )
      .filter(Boolean),
    amenities: normalizeTags(item.amenities || item.features),
    houseRules: normalizeTags(item.house_rules || item.rules),
    checkInTime: item.check_in_time || item.checkInTime || "",
    checkOutTime: item.check_out_time || item.checkOutTime || "",
    minNights: Number(item.min_nights || item.minNights || 0),
    maxNights: Number(item.max_nights || item.maxNights || 0),
    cancellationPolicy:
      item.cancellation_policy || item.cancellationPolicy || "",
    safetyNotes:
      item.safety_property || item.safety_notes || item.safetyNotes || "",
    raw: item,
  };
}

export function buildListingSectionsFromApartments(apartments = []) {
  const groupedSections = new Map();

  apartments.map(normalizeBackendApartment).forEach((apartment) => {
    const groupId = apartment.residenceId || "bedrock";

    if (!groupedSections.has(groupId)) {
      groupedSections.set(groupId, {
        id: `backend-${groupId}`,
        residenceId: groupId,
        title: apartment.residenceName,
        items: [],
      });
    }

    groupedSections.get(groupId).items.push(apartment);
  });

  return [...groupedSections.values()].filter(
    (section) => section.items.length,
  );
}

export function normalizeBackendBooking(item = {}, fallback = {}) {
  const booking = extractObject(item);
  const apartment = booking.apartment || booking.apartment_details || {};
  const bookingBackendId =
    booking.id ||
    booking.booking_id ||
    booking.bookingId ||
    booking.uuid ||
    fallback.backendId;
  const title =
    booking.title ||
    booking.apartment_title ||
    apartment.title ||
    apartment.name ||
    fallback.title ||
    "Apartment booking";
  const checkIn =
    booking.check_in ||
    booking.checkin ||
    booking.checkIn ||
    booking.start_date ||
    booking.startDate ||
    booking.arrival_date ||
    booking.arrivalDate ||
    booking.from_date ||
    booking.fromDate ||
    booking.date_from ||
    booking.dateFrom ||
    fallback.checkIn ||
    "";
  const checkOut =
    booking.check_out ||
    booking.checkout ||
    booking.checkOut ||
    booking.end_date ||
    booking.endDate ||
    booking.departure_date ||
    booking.departureDate ||
    booking.to_date ||
    booking.toDate ||
    booking.date_to ||
    booking.dateTo ||
    fallback.checkOut ||
    "";
  const status =
    booking.status ||
    booking.booking_status ||
    booking.bookingStatus ||
    booking.payment_status ||
    booking.paymentStatus ||
    fallback.status ||
    "upcoming";
  const totalAmount =
    booking.total_amount ??
    booking.totalAmount ??
    booking.payable_amount ??
    booking.amount ??
    fallback.totalAmount ??
    0;

  return {
    ...fallback,
    backendId: bookingBackendId,
    apartmentBackendId:
      booking.apartment_id ||
      booking.apartmentId ||
      apartment.id ||
      apartment.uuid ||
      fallback.apartmentBackendId ||
      fallback.apartmentId ||
      "",
    apartmentId:
      booking.apartment_id ||
      booking.apartmentId ||
      apartment.id ||
      apartment.uuid ||
      fallback.apartmentId ||
      fallback.apartmentBackendId ||
      "",
    id: String(
        booking.reference ||
        booking.booking_reference ||
        booking.booking_no ||
        booking.booking_id ||
        bookingBackendId ||
        fallback.id ||
        "",
    ),
    title,
    residenceName:
      booking.residence_name ||
      apartment.residence_name ||
      apartment.residence?.name ||
      fallback.residenceName ||
      "",
    location:
      booking.location ||
      booking.address ||
      apartment.location ||
      apartment.address ||
      fallback.location ||
      "",
    image: getImageUrl(apartment) || getImageUrl(booking) || fallback.image,
    checkIn,
    checkOut,
    guests: Number(
      booking.guests || booking.guest_count || fallback.guests || 1,
    ),
    guestName:
      booking.guest_name ||
      booking.guestName ||
      booking.guest?.name ||
      fallback.guestName ||
      "",
    guestPhone:
      booking.guest_phone ||
      booking.guest_phone_number ||
      booking.guestPhone ||
      booking.guestPhoneNumber ||
      booking.guest?.phone ||
      booking.guest?.phone_number ||
      fallback.guestPhone ||
      "",
    nights: Number(booking.nights || fallback.nights || 1),
    nightlyRate: Number(
      booking.nightly_rate ||
        booking.price_per_night ||
        apartment.price ||
        fallback.nightlyRate ||
        0,
    ),
    subtotal: Number(booking.subtotal || fallback.subtotal || 0),
    taxesAndFees: Number(
      booking.taxes_and_fees ||
        booking.taxesAndFees ||
        fallback.taxesAndFees ||
        0,
    ),
    cautionFee: Number(
      booking.caution_fee || booking.cautionFee || fallback.cautionFee || 0,
    ),
    rockPointValue: Number(
      booking.rock_point_value ||
        booking.rockPointValue ||
        fallback.rockPointValue ||
        0,
    ),
    totalAmount: Number(totalAmount),
    status,
    createdAt:
      booking.created_at || booking.createdAt || fallback.createdAt || "",
    paymentReference:
      booking.payment_reference ||
      booking.paymentReference ||
      booking.reference ||
      fallback.paymentReference ||
      "",
    reviewed: Boolean(
      booking.reviewed ||
        booking.has_review ||
        booking.hasReview ||
        booking.review ||
        fallback.reviewed,
    ),
    review: booking.review || booking.user_review || fallback.review || null,
    timeline: Array.isArray(booking.timeline)
      ? booking.timeline
      : fallback.timeline,
  };
}

export function normalizeBackendOrder(item = {}, fallback = {}) {
  const order = extractObject(item);
  const firstItem = order.items?.[0] || order.order_items?.[0] || {};
  const product = order.product || firstItem.product || {};
  const title =
    order.title ||
    order.name ||
    order.order_name ||
    product.title ||
    product.name ||
    firstItem.name ||
    fallback.title ||
    "Order";

  return {
    ...fallback,
    backendId: order.id || order.uuid || fallback.backendId,
    id: String(
      order.reference ||
        order.order_reference ||
        order.order_no ||
        order.id ||
        fallback.id ||
        "",
    ),
    title,
    orderType:
      order.order_type ||
      order.orderType ||
      order.type ||
      fallback.orderType ||
      fallback.category ||
      "",
    category:
      order.type ||
      order.category ||
      order.order_type ||
      fallback.category ||
      "Order",
    image: getImageUrl(product) || getImageUrl(order) || fallback.image || "",
    apartmentNumber:
      order.apartment_number ||
      order.apartmentNumber ||
      fallback.apartmentNumber ||
      "",
    deliveryTime:
      order.delivery_time || order.deliveryTime || fallback.deliveryTime || "",
    guests: Number(order.guest_count || order.guests || fallback.guests || 1),
    note: order.notes || order.note || fallback.note || "",
    totalAmount: Number(
      order.total_amount ||
        order.totalAmount ||
        order.amount ||
        fallback.totalAmount ||
        0,
    ),
    createdAt: order.created_at || order.createdAt || fallback.createdAt || "",
    status: order.status || fallback.status || "",
    paymentReference:
      order.payment_reference ||
      order.paymentReference ||
      order.reference ||
      fallback.paymentReference ||
      "",
    timeline: Array.isArray(order.timeline) ? order.timeline : fallback.timeline,
    raw: order,
  };
}

export function normalizeBackendCatalogItem(
  item = {},
  variant = "food",
  index = 0,
) {
  const category =
    item.category?.name ||
    item.category ||
    item.type ||
    item.meal_type ||
    item.service_type ||
    "";
  const rawTagValues = [
    category,
    ...normalizeTags(item.tags),
    ...normalizeTags(item.dietary_tags),
    ...normalizeTags(item.categories),
  ].filter(Boolean);
  const title =
    item.title ||
    item.name ||
    item.product_name ||
    item.food_name ||
    item.service_name ||
    "Item";
  const fallbackTags =
    variant === "food"
      ? ["Food", category || "Meal"]
      : variant === "services"
        ? ["Service", category || "Services"]
        : variant === "requests"
          ? ["Request"]
          : ["Toiletries", category || "Shop"];
  const price =
    Number(item.discounted_price || 0) > 0
      ? Number(item.discounted_price)
      : Number(item.price || item.amount || item.rate || item.base_price || 0);
  const isAvailable =
    item.is_available ??
    item.available ??
    item.in_stock ??
    item.is_active ??
    true;
  const preparationTime =
    item.preparation_time ||
    item.duration_label ||
    item.delivery_estimate ||
    item.estimated_time ||
    item.duration ||
    "";

  return {
    backendId: getBackendId(item),
    id: String(getBackendId(item) || `${variant}-${index + 1}`),
    title,
    description:
      item.description ||
      item.summary ||
      item.short_description ||
      category ||
      "Available from Bedrock",
    preparationTime:
      typeof preparationTime === "number"
        ? `${preparationTime} mins`
        : preparationTime || "Available on request",
    tags: [
      ...new Set(rawTagValues.length ? rawTagValues.map(String) : fallbackTags),
    ],
    rating: Number(item.rating || item.average_rating || 4.8),
    price,
    priceLabel: item.discounted_price_formatted || item.price_formatted || "",
    originalPrice: Number(
      item.price || item.amount || item.rate || item.base_price || 0,
    ),
    discountPercentage: Number(item.discount_percentage || 0),
    isAvailable: normalizeBoolean(isAvailable),
    image: getImageUrl(item),
    detailImage: getImageUrl(item),
    category,
    raw: item,
  };
}

export function normalizeBackendReview(item = {}, index = 0) {
  const user = item.user || item.guest || {};
  const author =
    item.author ||
    item.user_name ||
    item.guest_name ||
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    "Guest";
  const dateValue = item.created_at || item.createdAt || item.date || "";

  return {
    id: String(item.id || item.uuid || `review-${index + 1}`),
    rating: Number(item.rating || item.stars || 5),
    date: dateValue
      ? new Intl.DateTimeFormat("en", {
          month: "long",
          year: "numeric",
        }).format(new Date(dateValue))
      : "Recent",
    text: item.comment || item.review || item.message || "",
    author,
    location: user.location || item.location || "Bedrock Guest",
  };
}

export function normalizeBackendPricing(response, fallback = {}) {
  const payload = extractObject(response);
  const pricing =
    payload.pricing ||
    payload.summary ||
    payload.quote ||
    payload.breakdown ||
    payload;
  const subtotal = getPositiveNumber(
    pricing.subtotal,
    pricing.base_amount,
    pricing.baseAmount,
    fallback.subtotal,
  );
  const taxesAndFees = 0;
  const cautionFee = getPositiveNumber(
    pricing.caution_fee,
    pricing.cautionFee,
    pricing.refundable_caution_fee,
    pricing.refundableCautionFee,
    pricing.security_deposit,
    pricing.securityDeposit,
    pricing.refundable_deposit,
    pricing.refundableDeposit,
    pricing.deposit,
    fallback.cautionFee,
  );
  const total = subtotal + taxesAndFees + cautionFee;
  const canUseRockPoints =
    fallback.useRockPoints === undefined
      ? getNumberValue(fallback.rockPointValue, 0) > 0
      : Boolean(fallback.useRockPoints);
  const availableRockPointValue = getNumberValue(
    fallback.availableRockPointValue ??
      fallback.rockPointDiscountValue ??
      fallback.rockPointValue,
    0,
  );
  const backendRockPointValue = getPositiveNumber(
    pricing.rock_point_value,
    pricing.rockPointValue,
    pricing.rock_points_discount,
  );
  const rockPointValue = canUseRockPoints
    ? Math.min(
        backendRockPointValue || availableRockPointValue,
        Math.max(0, availableRockPointValue),
        total,
      )
    : 0;
  const couponDiscount =
    getPositiveNumber(
      pricing.coupon_discount,
      pricing.couponDiscount,
      pricing.discount_amount,
      pricing.discountAmount,
      pricing.discount,
      pricing.coupon_discount_amount,
      pricing.couponDiscountAmount,
      pricing.applied_discount,
      pricing.appliedDiscount,
      pricing.coupon?.discount_amount,
      pricing.coupon?.discountAmount,
      pricing.coupon?.discount,
      pricing.coupon?.amount,
      pricing.coupon?.value,
      pricing.coupon?.discount_value,
      pricing.coupon?.discountValue,
      pricing.applied_coupon?.discount_amount,
      pricing.applied_coupon?.discountAmount,
      pricing.applied_coupon?.discount,
      pricing.appliedCoupon?.discount_amount,
      pricing.appliedCoupon?.discountAmount,
      pricing.appliedCoupon?.discount,
      fallback.couponDiscount,
      fallback.discountAmount,
    ) || 0;
  const payable = Math.max(0, Number(total) - rockPointValue - couponDiscount);

  return {
    nights: getPositiveNumber(
      pricing.nights,
      pricing.total_nights,
      fallback.nights,
      1,
    ),
    subtotal,
    taxesAndFees,
    cautionFee,
    rockPointValue,
    couponCode:
      pricing.coupon_code ||
      pricing.couponCode ||
      pricing.coupon?.code ||
      fallback.couponCode ||
      "",
    couponDiscount,
    discountAmount: couponDiscount,
    couponMessage:
      pricing.coupon_message ||
      pricing.couponMessage ||
      pricing.discount_message ||
      pricing.discountMessage ||
      pricing.message ||
      pricing.coupon?.message ||
      pricing.applied_coupon?.message ||
      pricing.appliedCoupon?.message ||
      fallback.couponMessage ||
      "",
    isCouponValid:
      pricing.coupon_valid ??
      pricing.couponValid ??
      pricing.is_coupon_valid ??
      pricing.isCouponValid ??
      pricing.valid ??
      pricing.coupon?.valid ??
      pricing.coupon?.is_valid ??
      pricing.coupon?.isValid ??
      pricing.applied_coupon?.valid ??
      pricing.applied_coupon?.is_valid ??
      pricing.appliedCoupon?.valid ??
      pricing.appliedCoupon?.isValid ??
      (couponDiscount > 0 ? true : undefined),
    total,
    payable: Math.max(
      0,
      getNumberValue(
        payable,
        Math.max(0, Number(total) - rockPointValue - couponDiscount),
      ),
    ),
  };
}

export function normalizeBackendAvailability(response) {
  const availability = extractObject(response);
  const value =
    availability.available ??
    availability.is_available ??
    availability.available_for_dates ??
    availability.status;

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (["available", "true", "1", "yes"].includes(normalizedValue)) {
      return true;
    }

    if (
      ["unavailable", "false", "0", "no", "booked", "reserved"].includes(
        normalizedValue,
      )
    ) {
      return false;
    }

    return true;
  }

  if (typeof value === "number") {
    return value > 0;
  }

  return value === undefined ? true : Boolean(value);
}

export function normalizeBackendPayment(response) {
  const payment = extractObject(response);
  const nestedPayment =
    payment.payment ||
    payment.paystack ||
    payment.checkout ||
    payment.transaction ||
    payment.data?.payment ||
    payment.data?.paystack ||
    payment.data?.checkout ||
    {};

  return {
    reference:
      payment.reference ||
      payment.payment_reference ||
      payment.paymentReference ||
      payment.data?.reference ||
      nestedPayment.reference ||
      nestedPayment.payment_reference ||
      "",
    authorizationUrl:
      payment.authorization_url ||
      payment.authorizationUrl ||
      payment.payment_url ||
      payment.url ||
      nestedPayment.authorization_url ||
      nestedPayment.authorizationUrl ||
      nestedPayment.payment_url ||
      nestedPayment.paymentUrl ||
      nestedPayment.checkout_url ||
      nestedPayment.checkoutUrl ||
      nestedPayment.url ||
      payment.data?.authorization_url ||
      payment.data?.authorizationUrl ||
      payment.data?.payment_url ||
      payment.data?.paymentUrl ||
      payment.data?.checkout_url ||
      payment.data?.checkoutUrl ||
      payment.checkout_url ||
      payment.checkoutUrl ||
      "",
    raw: payment,
  };
}

export function normalizeBackendFavorite(item = {}, index = 0, fallback = {}) {
  const safeFallback =
    fallback && typeof fallback === "object" && !Array.isArray(fallback)
      ? fallback
      : {};
  const favorite = extractObject(item);
  const apartment =
    favorite.apartment ||
    favorite.apartment_details ||
    favorite.unit ||
    favorite.room ||
    favorite.property ||
    favorite;
  const normalizedApartment = normalizeBackendApartment(apartment, index);

  return {
    ...safeFallback,
    ...normalizedApartment,
    backendId:
      normalizedApartment.backendId ||
      favorite.apartment_id ||
      favorite.apartmentId ||
      safeFallback.backendId,
    id: String(
      normalizedApartment.backendId ||
        normalizedApartment.id ||
        favorite.apartment_id ||
        favorite.apartmentId ||
        safeFallback.id ||
        `favorite-${index + 1}`,
    ),
    title:
      normalizedApartment.title === "Apartment" && safeFallback.title
        ? safeFallback.title
        : normalizedApartment.title,
    image: normalizedApartment.image || safeFallback.image || "",
  };
}

export function normalizeBackendNotification(item = {}, index = 0) {
  return {
    id: String(item.id || item.uuid || `notification-${index + 1}`),
    title: item.title || item.subject || "Notification",
    message: item.message || item.body || item.description || "",
    read: Boolean(item.read_at || item.read || item.is_read),
    createdAt: item.created_at || item.createdAt || "",
  };
}

export function normalizeBackendDocument(item = {}, index = 0) {
  return {
    id: String(item.id || item.uuid || `document-${index + 1}`),
    name: item.name || item.title || item.type || "Document",
    type: item.type || item.document_type || "",
    status: item.status || "pending",
    url: item.url || item.file_url || item.document_url || "",
    createdAt: item.created_at || item.createdAt || "",
  };
}

export function normalizeBackendLegalItem(item = {}, index = 0) {
  const value = item.value || item.document || item.file || "";
  const valueObject = value && typeof value === "object" ? value : {};
  const valueText = typeof value === "string" ? value : "";
  const url =
    item.url ||
    item.link ||
    item.href ||
    item.document_url ||
    item.file_url ||
    valueObject.url ||
    valueObject.link ||
    valueObject.href ||
    valueObject.document_url ||
    valueObject.file_url ||
    (/^https?:\/\//i.test(valueText) ? valueText : "");
  const rawBody =
    item.body ||
    item.content ||
    item.description ||
    valueObject.body ||
    valueObject.content ||
    valueObject.description ||
    (/^https?:\/\//i.test(valueText) ? "" : valueText);
  const body = Array.isArray(rawBody)
    ? rawBody.join("\n\n")
    : typeof rawBody === "string"
      ? rawBody
      : "";

  return {
    id: String(item.id || item.slug || item.type || `legal-${index + 1}`),
    title:
      item.title ||
      item.name ||
      valueObject.title ||
      valueObject.name ||
      item.type ||
      "Legal document",
    body,
    url,
    type: item.type || item.slug || "",
    raw: item,
  };
}
