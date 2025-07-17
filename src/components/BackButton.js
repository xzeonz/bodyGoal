import Link from 'next/link';

export default function BackButton({ href = "/" }) {
  return (
    <Link
      href={href}
      className="inline-block px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition text-decoration-none"
    >
      Back
    </Link>
  );
}