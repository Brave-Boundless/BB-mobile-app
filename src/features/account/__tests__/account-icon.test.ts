import { describe, expect, it } from "@jest/globals";

import { appleFullName } from "../auth";
import { accountLook, initialsFor, initialsFromName } from "../account-icon";

describe("initialsFor", () => {
  it("takes up to two initials from the name part of the email", () => {
    expect(initialsFor("mark@braveandboundless.com")).toBe("M");
    expect(initialsFor("mark.nead@example.com")).toBe("MN");
    expect(initialsFor("jo_ann-smith@example.com")).toBe("JA");
    expect(initialsFor("a+tag@example.com")).toBe("AT");
  });

  it("returns null when there is nothing to show", () => {
    expect(initialsFor(undefined)).toBeNull();
    expect(initialsFor(null)).toBeNull();
    expect(initialsFor("")).toBeNull();
    expect(initialsFor("@example.com")).toBeNull();
    expect(initialsFor("..@example.com")).toBeNull();
  });
});

describe("accountLook", () => {
  it("uses the provider photo when there is one (Google)", () => {
    expect(
      accountLook({
        email: "m@x.com",
        user_metadata: {
          avatar_url: "https://lh3.googleusercontent.com/a/1",
          full_name: "Mark Nead",
        },
      }),
    ).toEqual({
      photo: "https://lh3.googleusercontent.com/a/1",
      initials: "MN",
    });
    expect(
      accountLook({ user_metadata: { picture: "https://example.com/p.jpg" } })
        .photo,
    ).toBe("https://example.com/p.jpg");
  });

  it("ignores photo URLs that are not https", () => {
    expect(
      accountLook({ user_metadata: { avatar_url: "http://example.com/p.jpg" } })
        .photo,
    ).toBeNull();
    expect(
      accountLook({ user_metadata: { avatar_url: "javascript:alert(1)" } })
        .photo,
    ).toBeNull();
  });

  it("prefers initials from the name (Apple) over the email, which may be a relay address", () => {
    expect(
      accountLook({
        email: "x7k2p9@privaterelay.appleid.com",
        user_metadata: { full_name: "Mark A. Nead" },
      }),
    ).toEqual({
      photo: null,
      initials: "MN",
    });
    expect(
      accountLook({ email: "mark.nead@example.com", user_metadata: {} })
        .initials,
    ).toBe("MN");
  });

  it("shows nothing for no user", () => {
    expect(accountLook(null)).toEqual({ photo: null, initials: null });
  });
});

describe("initialsFromName", () => {
  it("takes first and last initials", () => {
    expect(initialsFromName("Mark A. Nead")).toBe("MN");
    expect(initialsFromName("mark")).toBe("M");
    expect(initialsFromName("  Émile  zola ")).toBe("ÉZ");
    expect(initialsFromName("")).toBeNull();
    expect(initialsFromName(undefined)).toBeNull();
  });
});

describe("appleFullName", () => {
  it("joins the parts Apple sends", () => {
    expect(appleFullName({ givenName: "Mark", familyName: "Nead" })).toBe(
      "Mark Nead",
    );
    expect(appleFullName({ givenName: "Mark", familyName: null })).toBe("Mark");
    expect(appleFullName({ givenName: null, familyName: null })).toBeNull();
    expect(appleFullName(null)).toBeNull();
  });
});
