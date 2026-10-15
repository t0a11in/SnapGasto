/// Backends contemplados por el ecosistema y su puerto de desarrollo local.
enum BackendTarget {
  java(label: 'Java', port: 8080),
  dotNet(label: '.NET', port: 5000),
  python(label: 'Python', port: 8000),
  node(label: 'Node', port: 3000);

  const BackendTarget({required this.label, required this.port});

  final String label;
  final int port;

  static BackendTarget fromName(String? name) =>
      BackendTarget.values.where((target) => target.name == name).firstOrNull ??
      BackendTarget.java;
}
