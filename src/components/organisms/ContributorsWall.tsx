import * as React from "react";
import { Link } from "react-router";
import { Users, Star, GitFork, GitPullRequest, Heart, BookA, ExternalLink, Code2, Plus } from "lucide-react";
import { fetchContributors, fetchRepoStats, type Contributor, type RepoStats } from "@/lib/github";
import { useAppStore } from "@/store/useAppStore";
import { BadgeApp } from "@/components/atoms/BadgeApp";
import { ButtonApp } from "@/components/atoms/ButtonApp";

interface AggregatedGlossaryContributor {
  username: string;
  avatarUrl: string;
  termsCount: number;
  latestContribution: string;
}

export function ContributorsWall() {
  const { localGlossaries } = useAppStore();

  const [githubContributors, setGithubContributors] = React.useState<Contributor[]>([]);
  const [stats, setStats] = React.useState<RepoStats | null>(null);
  const [loadingGithub, setLoadingGithub] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"glossary" | "code">("glossary");

  const repoName = (import.meta.env.VITE_GITHUB_REPO || "").trim();

  // 1. REAL-TIME: Agregasi Kontributor Glosarium dari database/store lokal secara dinamis
  const glossaryContributors = React.useMemo<AggregatedGlossaryContributor[]>(() => {
    const map = new Map<string, AggregatedGlossaryContributor>();

    for (const item of localGlossaries) {
      const rawName = (item.contributor_name || "komunitas").trim().replace(/^@/, "");
      const avatar = item.contributor_avatar || `https://github.com/${rawName}.png`;
      const createdAt = item.created_at || new Date().toISOString();

      const existing = map.get(rawName);
      if (existing) {
        existing.termsCount += 1;
        if (createdAt > existing.latestContribution) {
          existing.latestContribution = createdAt;
        }
      } else {
        map.set(rawName, {
          username: rawName,
          avatarUrl: avatar,
          termsCount: 1,
          latestContribution: createdAt,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.termsCount - a.termsCount);
  }, [localGlossaries]);

  // 2. REAL-TIME: Fetch Kontributor Asli dari GitHub API (Hanya jika repo valid, TANPA DATA DUMMY)
  React.useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoadingGithub(true);
      try {
        const [contribList, repoStats] = await Promise.all([
          fetchContributors(repoName),
          fetchRepoStats(repoName),
        ]);
        if (isMounted) {
          setGithubContributors(contribList);
          setStats(repoStats);
        }
      } finally {
        if (isMounted) {
          setLoadingGithub(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [repoName]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Real-Time Community Banner */}
      <div className="bg-[#161F30] border border-[#26334D] rounded-[12px] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#F8FAFC]">Community Hub & Real-Time Hall of Fame</h3>
            <BadgeApp intent="karma" size="xs">
              Live Data
            </BadgeApp>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Daftar peringkat kontributor aktif yang berkontribusi secara nyata di proyek ini
          </p>
        </div>

        {/* Real Metrics Badges */}
        <div className="flex items-center gap-2">
          {stats ? (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#1C273C] border border-[#26334D] text-xs font-mono text-[#F8FAFC]">
                <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                <span>{stats.stars}</span>
                <span className="text-[#94A3B8] text-[10px]">stars</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#1C273C] border border-[#26334D] text-xs font-mono text-[#F8FAFC]">
                <GitFork className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>{stats.forks}</span>
                <span className="text-[#94A3B8] text-[10px]">forks</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#1C273C] border border-[#26334D] text-xs font-mono text-[#F8FAFC]">
              <BookA className="w-3.5 h-3.5 text-[#E95420]" />
              <span>{localGlossaries.length} Kosakata</span>
              <span className="text-[#94A3B8] text-[10px]">terdaftar</span>
            </div>
          )}

          {repoName && (
            <a
              href={`https://github.com/${repoName}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#E95420] text-white text-xs font-medium hover:bg-[#D04616] transition-colors"
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>Kirim PR</span>
            </a>
          )}
        </div>
      </div>

      {/* Hall of Fame: Contributors Grid */}
      <div className="bg-[#161F30] border border-[#26334D] rounded-[12px] p-5 space-y-4">
        {/* Tab Switcher & Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#26334D]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#E95420]" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F8FAFC]">
              Hall of Fame: Kontributor Teratas
            </h4>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#1C273C] border border-[#26334D] rounded-[8px]">
            <button
              onClick={() => setActiveTab("glossary")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                activeTab === "glossary"
                  ? "bg-[#E95420] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              <BookA className="w-3 h-3" />
              <span>Glosarium ({glossaryContributors.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                activeTab === "code"
                  ? "bg-[#E95420] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Kode GitHub ({githubContributors.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: KONTRIBUTOR GLOSARIUM KOMUNITAS (REAL-TIME DARI DATA NYATA) */}
        {activeTab === "glossary" && (
          <div className="space-y-4">
            {glossaryContributors.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#94A3B8] space-y-3 bg-[#1C273C]/50 rounded-[8px] border border-dashed border-[#26334D]">
                <p>Belum ada istilah glosarium yang terdaftar.</p>
                <Link to="/glossary">
                  <ButtonApp intent="primary" size="sm" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Jadilah Kontributor Glosarium Pertama</span>
                  </ButtonApp>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {glossaryContributors.map((c, idx) => (
                  <a
                    key={c.username}
                    href={`https://github.com/${c.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3.5 rounded-[8px] bg-[#1C273C] border border-[#26334D] hover:border-[#E95420]/50 transition-all group"
                  >
                    <img
                      src={c.avatarUrl}
                      alt={c.username}
                      className="w-11 h-11 rounded-full border border-[#26334D] object-cover group-hover:scale-105 transition-transform shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          c.username
                        )}&background=1C273C&color=F8FAFC`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#F8FAFC] flex items-center justify-between gap-1">
                        <span className="truncate">@{c.username}</span>
                        {idx === 0 ? (
                          <span className="text-[10px] text-[#F59E0B] font-mono shrink-0">👑 Juara 1</span>
                        ) : idx === 1 ? (
                          <span className="text-[10px] text-[#94A3B8] font-mono shrink-0">🥈 Juara 2</span>
                        ) : idx === 2 ? (
                          <span className="text-[10px] text-[#CD7F32] font-mono shrink-0">🥉 Juara 3</span>
                        ) : (
                          <span className="text-[10px] text-[#38BDF8] font-mono shrink-0">#{idx + 1}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#10B981] font-mono mt-0.5 flex items-center gap-1">
                        <span>{c.termsCount} istilah kosakata</span>
                      </div>
                      <div className="text-[10px] text-[#94A3B8] truncate mt-0.5 flex items-center gap-1">
                        <span>Lihat Profil</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 text-xs text-[#94A3B8]">
              <span>Ingin nama dan profil GitHub Anda tercatat di Hall of Fame?</span>
              <Link to="/glossary" className="text-[#E95420] hover:underline font-medium inline-flex items-center gap-1">
                Tambah Istilah Glosarium Baru <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* TAB 2: KONTRIBUTOR KODE GITHUB (REAL-TIME DARI GITHUB API) */}
        {activeTab === "code" && (
          <div className="space-y-4">
            {loadingGithub ? (
              <div className="p-8 text-center text-xs text-[#94A3B8]">
                Memuat data kontributor langsung dari GitHub API...
              </div>
            ) : githubContributors.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#94A3B8] space-y-2 bg-[#1C273C]/50 rounded-[8px] border border-dashed border-[#26334D]">
                <p className="font-semibold text-[#F8FAFC]">
                  {repoName ? "Belum ada kontributor commit terdaftar di repositori ini." : "Repositori GitHub belum ditentukan di konfigurasi."}
                </p>
                <p className="text-[11px]">
                  {repoName
                    ? `Kirim Pull Request ke https://github.com/${repoName} untuk tampil di sini.`
                    : "Tentukan VITE_GITHUB_REPO di file .env.local untuk menghubungkan repositori GitHub Anda."}
                </p>
                {repoName && (
                  <a
                    href={`https://github.com/${repoName}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-2"
                  >
                    <ButtonApp intent="primary" size="sm" className="gap-1.5">
                      <GitPullRequest className="w-3.5 h-3.5" />
                      <span>Buka Repositori GitHub</span>
                    </ButtonApp>
                  </a>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {githubContributors.map((c, idx) => (
                  <a
                    key={c.id}
                    href={c.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3.5 rounded-[8px] bg-[#1C273C] border border-[#26334D] hover:border-[#E95420]/50 transition-all group"
                  >
                    <img
                      src={c.avatar_url}
                      alt={c.login}
                      className="w-11 h-11 rounded-full border border-[#26334D] object-cover group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#F8FAFC] flex items-center justify-between gap-1">
                        <span className="truncate">@{c.login}</span>
                        {idx === 0 && <span className="text-[10px] text-[#F59E0B] font-mono">👑 Top</span>}
                      </div>
                      <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5 flex items-center gap-1">
                        <span>{c.contributions} commits / kontribusi</span>
                      </div>
                      <div className="text-[10px] text-[#38BDF8] truncate mt-0.5 flex items-center gap-1">
                        <span>GitHub Contributor</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contributing Guide Summary */}
      <div className="bg-[#161F30] border border-[#26334D] rounded-[12px] p-5 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#EF4444]" />
          Cara Berkontribusi di Proyek Ini
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#94A3B8]">
          <div className="bg-[#1C273C] p-3 rounded-[8px] border border-[#26334D]">
            <div className="font-semibold text-[#F8FAFC] mb-1">1. Tambah Glosarium (No-Code)</div>
            <div>Masuk dengan akun GitHub dan tambahkan istilah baru di menu Glosarium. Nama Anda langsung muncul di Hall of Fame secara real-time!</div>
          </div>
          <div className="bg-[#1C273C] p-3 rounded-[8px] border border-[#26334D]">
            <div className="font-semibold text-[#F8FAFC] mb-1">2. Kontribusi Kode (Pull Request)</div>
            <div>Fork repositori kami, tambahkan fitur atau perbaikan bug, dan kirimkan PR Anda ke branch utama.</div>
          </div>
          <div className="bg-[#1C273C] p-3 rounded-[8px] border border-[#26334D]">
            <div className="font-semibold text-[#F8FAFC] mb-1">3. Laporkan Isu / Format Gettext</div>
            <div>Buka issue di GitHub jika Anda menemukan string PO dengan format kurung kurawal atau placeholder khusus.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
