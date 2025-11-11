// src/pages/PerfumesPage.jsx
import React, { useState, useEffect } from "react";
import PerfumeCard from "../components/PerfumeCard";
import localProducts from "../data/products.json";
import { useCart } from "../context/cartContext";

export default function PerfumesPage() {
  const { items, addToCart, updateQty } = useCart();
  const [selectedPerfume, setSelectedPerfume] = useState(null);

useEffect(() => {
  if (selectedPerfume) {
    const updatedItem = items.find(item => item.product_id === selectedPerfume.id);
    if (updatedItem) {
      setSelectedPerfume(prev => ({ ...prev, qty: updatedItem.qty }));
    } 
    else {
      // Item removed from cart, keep selection but set qty to 0
      setSelectedPerfume(prev => prev ? { ...prev, qty: 0 } : null);
    }
  }
}, [items, selectedPerfume]);



  const products = localProducts.map((product) => {
    const cartItem = items.find((item) => item.product_id === product.id);
    return {
      ...product,
      qty: cartItem ? cartItem.qty : 0,
    };
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h3 className="text-2xl md:text-3xl font-semibold">Our Collection</h3>
      <p className="mt-1 text-gray-600">
        Discover our range of authentic oil-based perfumes.
      </p>

      {selectedPerfume ? (
        <div className="p-4 border rounded-lg bg-white shadow-md">
          <button
            className="text-sm text-amber-600 hover:underline"
            onClick={() => setSelectedPerfume(null)}
          >
            Back to collection
          </button>
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <img
              src={selectedPerfume.image}
              alt={selectedPerfume.alt || selectedPerfume.name}
              className="w-full sm:w-1/3 rounded-lg shadow-md"
            />
            <div>
              <h4 className="text-xl font-bold">{selectedPerfume.name}</h4>
              <p className="mt-2 text-gray-700">{selectedPerfume.description}</p>
              <div className="mt-4 font-medium">
                {/* Price: ₹{Number(selectedPerfume.price).toLocaleString("en-IN")} */}
                {/* Price: ₹{selectedPerfume.price ? Number(selectedPerfume.price).toLocaleString("en-IN") : "0"} */}
                Price: ₹{Number(selectedPerfume?.price ?? 0).toLocaleString("en-IN")}
              </div>
              <button
                className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                onClick={() => {
                  addToCart(selectedPerfume);
                  setSelectedPerfume((prev) => ({ ...prev, qty: 1 }));
                }}
              >
                {selectedPerfume.qty > 0 ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQty(selectedPerfume.id, selectedPerfume.qty - 1);
                        setSelectedPerfume((prev) => ({ ...prev, qty: prev.qty - 1 }));
                      }}
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span>{selectedPerfume.qty}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQty(selectedPerfume.id, selectedPerfume.qty + 1);
                        setSelectedPerfume((prev) => ({ ...prev, qty: prev.qty + 1 }));
                      }}
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  "Add to Cart"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <PerfumeCard
              key={p.id}
              name={p.name}
              description={p.description}
              price={p.price}
              productId={p.id}
              image={p.image}
              alt={p.alt || p.name}
              qty={p.qty}
              onAdd={() => addToCart(p)}
              onUpdateQty={(newQty) => updateQty(p.id, newQty)}
              onClick={() => setSelectedPerfume(p)}
            />
          ))}
        </div>
      )}
    </section>
  );
}