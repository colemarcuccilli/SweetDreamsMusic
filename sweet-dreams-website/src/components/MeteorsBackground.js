import React from "react";
import { Meteors } from "../../components/ui/aceternity";

export const MeteorsBackground = () => {
  return (
    <div className="relative h-full w-full">
      <Meteors number={20} />
    </div>
  );
};