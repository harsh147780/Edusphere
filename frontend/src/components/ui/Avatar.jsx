import { initials } from '../../lib/format';

const tones = ['indigo', 'sky', 'violet', 'emerald', 'amber'];

export default function Avatar({ name, src, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-[11px]', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  const tone = tones[(name || '').length % tones.length];
  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white`} />;
  }
  return (
    <div className={`avatar-${tone} ${sizes[size]} flex items-center justify-center rounded-full font-semibold`}>
      {initials(name)}
    </div>
  );
}
