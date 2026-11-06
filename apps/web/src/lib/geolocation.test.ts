import { describe, expect, it, vi } from "vitest";
import { LocationFailure, locationErrorMessage, requestCurrentLocation } from "./geolocation";

function device() {
  const getCurrentPosition=vi.fn();
  return { getCurrentPosition, api: { getCurrentPosition } as unknown as Geolocation };
}
const position={coords:{latitude:0,longitude:-74}} as GeolocationPosition;
describe("device location requests", () => {
  it("accepts zero/negative coordinates and a recent low-power location", async () => {
    const {api,getCurrentPosition}=device();
    getCurrentPosition.mockImplementationOnce(success => success(position));
    expect(await requestCurrentLocation(api,true)).toEqual({latitude:0,longitude:-74});
    expect(getCurrentPosition.mock.calls[0][2]).toEqual({enableHighAccuracy:false,maximumAge:60_000,timeout:15_000});
  });
  it.each([2,3])("retries a temporary failure (%s) with a fresh high-accuracy fix", async code => {
    const {api,getCurrentPosition}=device();
    getCurrentPosition.mockImplementationOnce((_success,error) => error({code}));
    getCurrentPosition.mockImplementationOnce(success => success(position));
    expect(await requestCurrentLocation(api,true)).toEqual({latitude:0,longitude:-74});
    expect(getCurrentPosition.mock.calls[1][2]).toEqual({enableHighAccuracy:true,maximumAge:0,timeout:20_000});
  });
  it("never retries or bypasses denied permission", async () => {
    const {api,getCurrentPosition}=device();
    getCurrentPosition.mockImplementationOnce((_success,error) => error({code:1}));
    await expect(requestCurrentLocation(api,true)).rejects.toMatchObject({reason:"denied"});
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });
  it("preserves the final failure and bounds retries", async () => {
    const {api,getCurrentPosition}=device();
    getCurrentPosition.mockImplementation((_success,error) => error({code:3}));
    await expect(requestCurrentLocation(api,true)).rejects.toMatchObject({reason:"timeout"});
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
  });
  it("rejects unsupported and insecure contexts without requesting a location", async () => {
    const {api,getCurrentPosition}=device();
    await expect(requestCurrentLocation(undefined,true)).rejects.toMatchObject({reason:"unsupported"});
    await expect(requestCurrentLocation(api,false)).rejects.toMatchObject({reason:"insecure"});
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });
  it("rejects invalid device data rather than inventing a location", async () => {
    const {api,getCurrentPosition}=device();
    getCurrentPosition.mockImplementation(success => success({coords:{latitude:NaN,longitude:200}}));
    await expect(requestCurrentLocation(api,true)).rejects.toMatchObject({reason:"unavailable"});
  });
  it("gives specific safe recovery instructions without leaking native messages", () => {
    expect(locationErrorMessage(new LocationFailure("denied"))).toContain("site's settings");
    expect(locationErrorMessage(new LocationFailure("unavailable"))).toContain("Location Services");
    expect(locationErrorMessage(new LocationFailure("timeout"))).toContain("too long");
    expect(locationErrorMessage(new LocationFailure("insecure"))).toContain("https://");
    expect(locationErrorMessage(new LocationFailure("unsupported"))).toContain("another browser");
    expect(locationErrorMessage(new Error("private native diagnostics"))).not.toContain("private native diagnostics");
  });
});
