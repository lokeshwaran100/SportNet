"use client";

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faGithub } from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
  return (
    <div className="bg-purple-700 text-white py-6 border-t-2 border-t-black" id="footer">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <h6>© 2024 Sportnet. All rights reserved</h6>
          <ul className="lg:flex gap-12 hidden items-center">
            <li>
              <Link href="https://x.com/Sport3Net" target="_blank" passHref>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faTwitter} />
                  Twitter
                </div>
              </Link>
            </li>
            <li>
              <Link href="https://github.com/lokeshwaran100/SportNet" target="_blank" passHref>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faGithub} />
                  Github
                </div>
              </Link>
            </li>
            <li>
              <Link href="https://github.com/SportnetOfficial/Landing-Page" target="_blank" passHref>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faGithub} />
                  Github
                </div>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Footer;
