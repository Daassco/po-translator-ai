export interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

export interface RepoStats {
  stars: number;
  forks: number;
  openIssues: number;
  repoUrl: string;
  releaseVersion: string;
}

const DEFAULT_REPO = (import.meta.env.VITE_GITHUB_REPO || "Daassco/po-translator-ai").trim();

/**
 * Fetch data kontributor asli secara real-time dari GitHub API
 * JANGAN PERNAH gunakan data dummy! Jika tidak ada repo / gagal, kembalikan array kosong.
 */
export async function fetchContributors(repo = DEFAULT_REPO): Promise<Contributor[]> {
  if (!repo) {
    return [];
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/contributors?per_page=30`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) {
      console.warn(`GitHub API returned status ${res.status} for repository: ${repo}`);
      return [];
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      return data.filter((item) => item.type === "User");
    }
    return [];
  } catch (error) {
    console.error("Gagal mengambil data kontributor GitHub secara real-time:", error);
    return [];
  }
}

/**
 * Fetch statistik repo asli (stars, forks, open issues) dari GitHub API
 */
export async function fetchRepoStats(repo = DEFAULT_REPO): Promise<RepoStats | null> {
  if (!repo) {
    return null;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return {
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      openIssues: data.open_issues_count ?? 0,
      repoUrl: data.html_url || `https://github.com/${repo}`,
      releaseVersion: "v3.0.0",
    };
  } catch {
    return null;
  }
}
