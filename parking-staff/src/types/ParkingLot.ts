export interface ParkingLot {
  id?: string;
  name: string;
  capacity: number;
  occupiedSlots?: number;
  status?: string;
  /** false = exit-only, no new entries */
  isAcceptingEntries?: boolean;
}
