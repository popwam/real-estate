import 'package:flutter/material.dart';

class ImageCarouselPlaceholder extends StatelessWidget {
  const ImageCarouselPlaceholder({super.key, this.imageUrl});

  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: imageUrl == null
            ? DecoratedBox(
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest,
                ),
                child: const Center(
                  child: Icon(Icons.photo_library_outlined, size: 42),
                ),
              )
            : Image.network(
                imageUrl!,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return DecoratedBox(
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surfaceContainerHighest,
                    ),
                    child: const Center(child: Icon(Icons.broken_image_outlined)),
                  );
                },
              ),
      ),
    );
  }
}
