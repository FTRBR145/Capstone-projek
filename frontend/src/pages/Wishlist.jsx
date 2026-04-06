import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import { wishlistService } from "../services/wishlistService";
import { transactionService } from "../services/transactionService";
import { formatRupiah } from "../utils/helpers";
import Modal from "../components/ui/Modal";
import Footer from "../components/layout/Footer";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const formatRupiahInput = (value) => {
  if (!value) return "";

  // Hanya ambil angka
  const number = value.toString().replace(/[^,\d]/g, "");
  const split = number.split(",");
  let sisa = split[0].length % 3;
  let rupiah = split[0].substr(0, sisa);
  const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

  if (ribuan) {
    const separator = sisa ? "." : "";
    rupiah += separator + ribuan.join(".");
  }

  rupiah = split[1] !== undefined ? rupiah + "," + split[1] : rupiah;
  return rupiah;
};

const parseRupiahToNumber = (rupiahString) => {
  if (!rupiahString) return 0;
  return parseInt(rupiahString.replace(/[^,\d]/g, "")) || 0;
};

export default function Wishlist() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [wishlists, setWishlists] = useState([]);
  const [summary, setSummary] = useState({ saldo: 0 });
  const [search, setSearch] = useState("");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    savedAmount: "",
  });
  const [targetAmountDisplay, setTargetAmountDisplay] = useState("");
  const [savedAmountDisplay, setSavedAmountDisplay] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        fetchWishlists();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [summaryRes, wishlistRes] = await Promise.all([
        transactionService.getSummary(),
        wishlistService.getWishlists(),
      ]);
      setSummary(summaryRes.data);
      setWishlists(wishlistRes.data);
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlists = async () => {
    try {
      const res = await wishlistService.getWishlists(search);
      setWishlists(res.data);
    } catch (error) {
      toast.error("Gagal memuat wishlist");
    }
  };

  const openAddModal = () => {
    setEditItem(null);
    setFormData({
      name: "",
      targetAmount: "",
      savedAmount: "0",
    });
    setTargetAmountDisplay("");
    setSavedAmountDisplay("");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      targetAmount: item.target_amount.toString(),
      savedAmount: item.saved_amount.toString(),
    });
    setTargetAmountDisplay(formatRupiahInput(item.target_amount.toString()));
    setSavedAmountDisplay(formatRupiahInput(item.saved_amount.toString()));
    setModalOpen(true);
  };

  // Handler untuk input target amount
  const handleTargetAmountChange = (e) => {
    const rawValue = e.target.value;
    const formatted = formatRupiahInput(rawValue);
    const numericValue = parseRupiahToNumber(formatted);

    setTargetAmountDisplay(formatted);
    setFormData({ ...formData, targetAmount: numericValue.toString() });
  };

  // Handler untuk input saved amount
  const handleSavedAmountChange = (e) => {
    const rawValue = e.target.value;
    const formatted = formatRupiahInput(rawValue);
    const numericValue = parseRupiahToNumber(formatted);

    setSavedAmountDisplay(formatted);
    setFormData({ ...formData, savedAmount: numericValue.toString() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const target = parseInt(formData.targetAmount);
    const saved = parseInt(formData.savedAmount) || 0;

    if (!formData.name.trim()) {
      toast.error("Nama wishlist harus diisi");
      return;
    }
    if (!target || target <= 0) {
      toast.error("Target nominal harus lebih dari 0");
      return;
    }
    if (saved < 0) {
      toast.error("Nominal terkumpul tidak valid");
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: formData.name.trim(),
        targetAmount: target,
        savedAmount: saved,
      };

      if (editItem) {
        await wishlistService.updateWishlist(editItem.id, data);
        toast.success("Wishlist berhasil diupdate");
      } else {
        await wishlistService.createWishlist(data);
        toast.success("Wishlist berhasil ditambahkan");
      }

      setModalOpen(false);
      await fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus wishlist ini?")) return;

    setLoading(true);
    try {
      await wishlistService.deleteWishlist(id);
      toast.success("Wishlist berhasil dihapus");
      await fetchAllData();
    } catch (error) {
      toast.error("Gagal menghapus wishlist");
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (saved, target) => {
    if (!target) return 0;
    return Math.min(100, Math.round((saved / target) * 100));
  };

  if (loading && !modalOpen) {
    return <LoadingSpinner />;
  }

  return (
    <div className="text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Wishlist Saya</h2>
        <button
          onClick={openAddModal}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          + Tambah Wishlist
        </button>
      </div>

      <div className="bg-emerald-600 rounded-xl p-4 mb-6">
        <p className="text-sm opacity-90">Saldo Tersedia</p>
        <p className="text-2xl font-bold">Rp {formatRupiah(summary.saldo)}</p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Cari wishlist..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wishlists.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            Belum ada wishlist. Yuk buat wishlist pertama!
          </div>
        ) : (
          wishlists.map((item) => {
            const progress = calculateProgress(
              item.saved_amount,
              item.target_amount,
            );
            return (
              <div key={item.id} className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-2">{item.name}</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Target:</span>
                    <span className="font-mono">
                      Rp {formatRupiah(item.target_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Terkumpul:</span>
                    <span className="font-mono">
                      Rp {formatRupiah(item.saved_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sisa:</span>
                    <span className="font-mono">
                      Rp {formatRupiah(item.target_amount - item.saved_amount)}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>
                      {Math.min(
                        100,
                        Math.round(
                          (item.saved_amount / item.target_amount) * 100,
                        ),
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-emerald-500 rounded-full h-2 transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((item.saved_amount / item.target_amount) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => openEditModal(item)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Edit Wishlist" : "Tambah Wishlist"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nama Wishlist
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Contoh: Laptop Baru"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Target Nominal
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                Rp
              </span>
              <input
                type="text"
                value={targetAmountDisplay}
                onChange={handleTargetAmountChange}
                placeholder="0"
                className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Sudah Terkumpul
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                Rp
              </span>
              <input
                type="text"
                value={savedAmountDisplay}
                onChange={handleSavedAmountChange}
                placeholder="0"
                className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Kosongi jika belum ada tabungan
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  );
}
