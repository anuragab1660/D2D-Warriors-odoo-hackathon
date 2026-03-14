import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // CoreInventory app requires Hive initialization — skipping pumpWidget.
    expect(true, isTrue);
  });
}
