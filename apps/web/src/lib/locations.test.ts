import { describe, expect, it } from "vitest";
import { parseCoordinates } from "./locations";
describe("location entry", () => {
  it("accepts locations outside the Bengaluru pilot, including zero and negative coordinates", () => {
    expect(parseCoordinates("40.7128", "-74.0060")).toEqual({ latitude: 40.7128, longitude: -74.006 });
    expect(parseCoordinates("0", "0")).toEqual({ latitude: 0, longitude: 0 });
    expect(parseCoordinates("-90", "180")).toEqual({ latitude: -90, longitude: 180 });
  });
  it.each([["", "0"], ["1", ""], [" ", "10"], ["91", "12"], ["-91", "12"], ["0", "181"], ["Infinity", "0"], ["wrong", "0"]])("rejects missing or invalid coordinates %s, %s", (lat, lng) => {
    expect(parseCoordinates(lat, lng)).toBeNull();
  });
});
