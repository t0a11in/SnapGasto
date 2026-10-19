import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/money_format.dart';
import '../../../shared/widgets/stat_card.dart';

/// Resumen del mes: total, tarjeta y físico.
class IncomeSummaryCards extends StatelessWidget {
  const IncomeSummaryCards({super.key, required this.summary});

  final IncomeMonthlySummaryResponse? summary;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Resumen del mes',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          StatCard(
            label: 'Total del mes',
            value: formatMoney(summary?.total ?? 0),
            valueColor: AppColors.success,
            large: true,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: StatCard(label: 'Tarjeta', value: formatMoney(summary?.totalTarjeta ?? 0))),
              const SizedBox(width: 12),
              Expanded(child: StatCard(label: 'Físico', value: formatMoney(summary?.totalFisico ?? 0))),
            ],
          ),
        ],
      ),
    );
  }
}
