
import { ArrowRight, Leaf } from "lucide-react";

/*
  DEVELOPER: Olentiki

  RESPONSIBILITY:
  Display the announcement banner above the navigation.
*/

function Announcement() {
  return (
    <div className="announcement">
      <span className="announcement-mark">
        <Leaf size={14} />
      </span>

      Good things go around. Find your next favorite nearby.

      <a href="#finds">
        Explore the loop <ArrowRight size={13} />
      </a>
    </div>
  );
}

export default Announcement;
