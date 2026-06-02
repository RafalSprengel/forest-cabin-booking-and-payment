"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Modal from "@/app/_components/Modal/Modal";
import { deleteBookingAction } from "@/actions/adminBookingActions";
import Button from "@/app/_components/UI/Button/Button";

export default function DeletePastBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteBookingAction(bookingId);
    if (result.success) {
      toast.success("Rezerwacja została usunięta.");
      router.refresh();
    } else {
      toast.error("Błąd: " + (result.message || "Nie udało się usunąć rezerwacji."));
      setIsDeleting(false);
    }
    setShowConfirm(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="danger"
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
      >
        {isDeleting ? "Usuwanie..." : "Usuń"}
      </Button>
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Usuń rezerwację"
        confirmText="Usuń"
        cancelText="Anuluj"
        confirmVariant="danger"
        isLoading={isDeleting}
      >
        <p>Czy na pewno usunąć tę rezerwację? Tej operacji nie można cofnąć.</p>
      </Modal>
    </>
  );
}
