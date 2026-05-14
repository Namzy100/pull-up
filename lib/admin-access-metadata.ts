/** Normalize access_requests.metadata from signup + profile flows. */

export type ParsedBusinessAccess = {
  businessName: string;
  businessType: string;
  contactPerson: string;
  contactChannel: string;
  websiteOrSocial: string;
  area: string;
  explanation: string;
};

export type ParsedHostAccess = {
  organizationName: string;
  organizationType: string;
  contactPerson: string;
  contactChannel: string;
  socialOrProof: string;
  campus: string;
  explanation: string;
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function parseBusinessAccessMetadata(
  meta: Record<string, unknown> | null | undefined
): ParsedBusinessAccess {
  if (!meta) {
    return {
      businessName: "",
      businessType: "",
      contactPerson: "",
      contactChannel: "",
      websiteOrSocial: "",
      area: "",
      explanation: "",
    };
  }
  return {
    businessName: str(meta.businessName),
    businessType: str(meta.businessType),
    contactPerson: str(meta.contactPerson),
    contactChannel: str(meta.contactChannel),
    websiteOrSocial: str(meta.websiteOrSocial),
    area: str(meta.area),
    explanation: str(meta.explanation),
  };
}

export function parseHostAccessMetadata(
  meta: Record<string, unknown> | null | undefined
): ParsedHostAccess {
  if (!meta) {
    return {
      organizationName: "",
      organizationType: "",
      contactPerson: "",
      contactChannel: "",
      socialOrProof: "",
      campus: "",
      explanation: "",
    };
  }
  const proof = str(meta.affiliationProofUrl);
  const social = str(meta.socialUrl);
  return {
    organizationName: str(meta.organizationName),
    organizationType: str(meta.organizationType),
    contactPerson: str(meta.contactPersonName),
    contactChannel: str(meta.contactChannel),
    socialOrProof: proof || social || str(meta.businessWebsite),
    campus: str(meta.campus),
    explanation: str(meta.explanation),
  };
}
