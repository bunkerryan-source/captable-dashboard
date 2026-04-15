"use client";

import { useCallback } from "react";
import {
  useDashboard,
  useDashboardDispatch,
  type DashboardState,
} from "@/context/DashboardContext";

export function useModal(modalName: NonNullable<DashboardState["activeModal"]>) {
  const { activeModal } = useDashboard();
  const dispatch = useDashboardDispatch();

  const isOpen = activeModal === modalName;

  const open = useCallback(() => {
    dispatch({ type: "OPEN_MODAL", modal: modalName });
  }, [dispatch, modalName]);

  const close = useCallback(() => {
    dispatch({ type: "CLOSE_MODAL" });
  }, [dispatch]);

  return { isOpen, open, close };
}
