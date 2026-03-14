import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../utils/app_theme.dart';

/// Bar chart showing movement count per type (receipt/delivery/transfer/adj).
class MovementBarChart extends StatelessWidget {
  final Map<String, int> data; // label → count

  const MovementBarChart({super.key, required this.data});

  static const List<Color> _colors = [
    AppTheme.accent,
    AppTheme.error,
    AppTheme.info,
    AppTheme.warning,
  ];

  @override
  Widget build(BuildContext context) {
    final entries = data.entries.toList();
    if (entries.isEmpty) return const SizedBox.shrink();

    final maxY = entries
        .map((e) => e.value.toDouble())
        .reduce((a, b) => a > b ? a : b);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Movement Summary',
              style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 150,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY: maxY * 1.25,
                  barTouchData: BarTouchData(enabled: false),
                  titlesData: FlTitlesData(
                    leftTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false)),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (v, _) {
                          final i = v.toInt();
                          if (i < 0 || i >= entries.length) {
                            return const SizedBox.shrink();
                          }
                          return Text(entries[i].key,
                              style: const TextStyle(
                                  fontSize: 10,
                                  color: AppTheme.textSecondary));
                        },
                      ),
                    ),
                  ),
                  gridData: const FlGridData(show: false),
                  borderData: FlBorderData(show: false),
                  barGroups: List.generate(entries.length, (i) {
                    return BarChartGroupData(
                      x: i,
                      barRods: [
                        BarChartRodData(
                          toY: entries[i].value.toDouble(),
                          color: _colors[i % _colors.length],
                          width: 32,
                          borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(6)),
                        ),
                      ],
                    );
                  }),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Pie chart — kept for future use when category stats endpoint is available.
class DashboardPieChart extends StatefulWidget {
  final List<MapEntry<String, int>> data; // label → count

  const DashboardPieChart({super.key, required this.data});

  @override
  State<DashboardPieChart> createState() => _DashboardPieChartState();
}

class _DashboardPieChartState extends State<DashboardPieChart> {
  int _touched = -1;

  static const List<Color> _colors = [
    AppTheme.accent,
    AppTheme.info,
    Color(0xFF8B5CF6),
    AppTheme.warning,
    Color(0xFFEC4899),
    Color(0xFF06B6D4),
  ];

  @override
  Widget build(BuildContext context) {
    if (widget.data.isEmpty) return const SizedBox.shrink();
    final total = widget.data.fold<int>(0, (s, e) => s + e.value);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          SizedBox(
            height: 180,
            child: PieChart(
              PieChartData(
                pieTouchData: PieTouchData(
                  touchCallback: (ev, res) => setState(() {
                    _touched = (!ev.isInterestedForInteractions ||
                            res?.touchedSection == null)
                        ? -1
                        : res!.touchedSection!.touchedSectionIndex;
                  }),
                ),
                borderData: FlBorderData(show: false),
                sectionsSpace: 3,
                centerSpaceRadius: 48,
                sections: List.generate(widget.data.length, (i) {
                  final pct = total > 0
                      ? widget.data[i].value / total * 100
                      : 0.0;
                  final isTouched = i == _touched;
                  return PieChartSectionData(
                    color: _colors[i % _colors.length],
                    value: widget.data[i].value.toDouble(),
                    title: pct >= 8 ? '${pct.toStringAsFixed(0)}%' : '',
                    radius: isTouched ? 62.0 : 50.0,
                    titleStyle: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
                  );
                }),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 6,
            children: List.generate(widget.data.length, (i) => Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                        color: _colors[i % _colors.length],
                        shape: BoxShape.circle)),
                const SizedBox(width: 4),
                Text('${widget.data[i].key} (${widget.data[i].value})',
                    style: const TextStyle(
                        fontSize: 12, color: AppTheme.textSecondary)),
              ],
            )),
          ),
        ]),
      ),
    );
  }
}
