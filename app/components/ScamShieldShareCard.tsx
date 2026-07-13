'use client';

interface ScamShieldShareCardProps {
  score: number;
  total: number;
}

export default function ScamShieldShareCard({ score, total }: ScamShieldShareCardProps) {
  const message = `I scored ${score}/${total} on the MoneyVerse Scam Shield quiz for kids. Can you beat it?`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Scam Shield Score',
          text: message,
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${message} ${window.location.href}`);
        alert('Score copied to clipboard!');
      } catch {
        // Ignore
      }
    }
  };

  return (
    <div className="p-6 bg-mv-lavender/30 rounded-xl border border-mv-lavender">
      <p className="text-sm text-mv-dark/70 mb-2">Safe share card</p>
      <p className="text-lg font-semibold text-mv-dark mb-4">{message}</p>
      <button
        onClick={handleShare}
        className="px-4 py-2 rounded-lg bg-mv-primary text-white text-sm font-medium hover:bg-mv-primary/90"
      >
        Share score
      </button>
    </div>
  );
}
