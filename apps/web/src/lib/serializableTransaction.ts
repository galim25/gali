import { prisma, Prisma } from "@barberbook/db";

/**
 * Serializable transactions abort with a P2034 write-conflict whenever two
 * concurrent writes touch the same work day's rows, even if they target
 * different, non-overlapping slots. Retrying a few times keeps that
 * expected-under-load case invisible to the caller; a genuine business
 * rejection (e.g. SLOT_TAKEN) is a plain Error (not P2034) and is never
 * retried. Kept outside any "use server" file — a function argument isn't
 * serializable across the server-action boundary.
 */
export async function runSerializable<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (err) {
      const isWriteConflict =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034";
      if (!isWriteConflict || attempt === MAX_ATTEMPTS) throw err;
    }
  }
  throw new Error("unreachable");
}
