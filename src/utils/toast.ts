import Swal from "sweetalert2";

export const Toast = Swal.mixin({
  toast: true,
  position: "top-end", // muncul di pojok kanan atas
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});
