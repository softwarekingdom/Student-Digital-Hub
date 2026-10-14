
#include <iostream>
#include <vector>
#include <string>
using namespace std;

struct RankProgress {
    int rankNumber;
    long long currentMinimumXP;
    int nextRankNumber;
    long long nextMinimumXP;
    int progressPercent;
};

RankProgress calculateRankProgress(
    long long totalXP,
    const vector<long long>& thresholds
) {
    RankProgress result{0, 0, 0, 0, 0};

    for (size_t i = 0; i < thresholds.size(); ++i) {
        if (totalXP >= thresholds[i]) {
            result.rankNumber = static_cast<int>(i + 1);
            result.currentMinimumXP = thresholds[i];
        } else {
            result.nextRankNumber = static_cast<int>(i + 1);
            result.nextMinimumXP = thresholds[i];
            break;
        }
    }

    if (result.nextRankNumber != 0) {
        long long range =
            result.nextMinimumXP - result.currentMinimumXP;
        long long earned =
            totalXP - result.currentMinimumXP;

        if (range > 0) {
            result.progressPercent = static_cast<int>(
                earned * 100 / range
            );
        }
    } else if (!thresholds.empty()) {
        result.progressPercent = 100;
    }

    return result;
}

int main() {
    long long totalXP;
    int rankCount;

    if (!(cin >> totalXP >> rankCount) ||
        totalXP < 0 || rankCount < 1 || rankCount > 100) {
        cerr << "Invalid input\n";
        return 1;
    }

    vector<long long> thresholds;
    thresholds.reserve(rankCount);

    for (int i = 0; i < rankCount; ++i) {
        long long threshold;

        if (!(cin >> threshold) || threshold < 0) {
            cerr << "Invalid rank threshold\n";
            return 1;
        }

        if (!thresholds.empty() &&
            threshold <= thresholds.back()) {
            cerr << "Thresholds must increase\n";
            return 1;
        }

        thresholds.push_back(threshold);
    }

    RankProgress result =
        calculateRankProgress(totalXP, thresholds);

    cout << "total_xp=" << totalXP << '\n';
    cout << "rank_number=" << result.rankNumber << '\n';
    cout << "current_rank_minimum_xp="
         << result.currentMinimumXP << '\n';
    cout << "next_rank_number="
         << result.nextRankNumber << '\n';
    cout << "next_rank_minimum_xp="
         << result.nextMinimumXP << '\n';
    cout << "rank_progress_percent="
         << result.progressPercent << '\n';

    return 0;
}
