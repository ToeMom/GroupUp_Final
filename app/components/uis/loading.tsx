import { Loader } from "lucide-react";
import React, { FC } from "react";

export const MyLoader: FC = () => {
    return(
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-[#2A56C6] animate-spin mx-auto" />
          <p className="mt-4 text-lg font-semibold text-gray-700">
            Načítání...
          </p>
        </div>
      </div>
    )
}