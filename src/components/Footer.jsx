import React from "react";

export default function Footer({ setCurrentPage }) {
  return (
    <footer className="mt-12 border-t border-gray-100">
      <div className="mx-auto max-w-6xl px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
        {/* Column 1 */}
        <div>
          <button onClick={() => setCurrentPage?.("home")} className="text-left">
            <h4 className="text-lg font-semibold">SAHUMäRIO</h4>
          </button>
          <p className="mt-2 text-gray-600">
            Authentic oil-based perfumes that last all day.
          </p>
        </div>

        {/* Column 2 */}
        <div>
          <h5 className="font-medium">Quick Links</h5>
          <ul className="mt-2 space-y-1 text-gray-600">
            <li>
              <button
                onClick={() => setCurrentPage?.("home")}
                className="hover:text-gray-900"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentPage?.("perfumes")}
                className="hover:text-gray-900"
              >
                Perfumes
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentPage?.("about")}
                className="hover:text-gray-900"
              >
                About
              </button>
            </li>
            <li>
              <a href="mailto:sahumariofragnance@gmail.com" className="hover:text-gray-900">
                Contact
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h5 className="font-medium">Connect</h5>
          <p className="mt-2 text-gray-600">Email: sahumariofragnance@gmail.com</p>
          <p className="text-gray-600">Phone: +91 9974599911</p>
          <p className="mt-4 text-gray-500">© 2025 SAHUMäRIO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}